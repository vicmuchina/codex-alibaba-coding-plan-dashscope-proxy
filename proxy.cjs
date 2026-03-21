#!/usr/bin/env node
const http = require('http');
const https = require('https');

const API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-sp-538c754005aa4fc08d2f82331479ac05';
const PORT = process.env.PROXY_PORT || 8765;

const DASHSCOPE_URL = 'https://coding-intl.dashscope.aliyuncs.com/apps/anthropic/v1/messages';

const server = http.createServer((req, res) => {
  const url = req.url;
  let body = '';
  
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
    if (url === '/health') { res.writeHead(200); res.end('{"status":"ok"}'); return; }
    if (url === '/v1/responses' && req.method === 'POST') { handleResponses(res, body); return; }
    res.writeHead(404); res.end('{"error":"not found"}');
  });
});

function handleResponses(res, body) {
  try {
    const parsed = JSON.parse(body);
    const stream = parsed.stream === true;
    
    const messages = convertInputToMessages(parsed.input || []);
    const tools = convertTools(parsed.tools || []);
    
    const anthropicReq = {
      model: parsed.model || 'qwen3.5-plus',
      max_tokens: parsed.max_tokens || 4096,
      messages,
      stream: false,
      system: parsed.instructions || undefined,
      ...(tools.length > 0 && { tools }),
    };
    
    console.log('Request - Model:', anthropicReq.model, 'Stream:', stream, 'Tools:', tools.length);
    
    const req2 = https.request(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'User-Agent': 'curl/8.5.0',
      },
    }, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        if (res2.statusCode !== 200) {
          console.error('Error from DashScope:', data.substring(0, 300));
          res.writeHead(res2.statusCode, {'Content-Type': 'application/json'});
          res.end(data);
          return;
        }
        
        try {
          const anthro = JSON.parse(data);
          sendResponse(res, anthro, stream);
        } catch (e) {
          console.error('Parse error:', e);
          res.writeHead(500); res.end('{"error":"parse"}');
        }
      });
    });
    
    req2.on('error', e => { console.error('Error:', e); res.writeHead(500); res.end('{"error":"' + e.message + '"}'); });
    req2.write(JSON.stringify(anthropicReq));
    req2.end();
    
  } catch (e) {
    console.error('Error:', e);
    res.writeHead(400); res.end('{"error":"' + e.message + '"}');
  }
}

function convertInputToMessages(input) {
  const messages = [];
  
  for (const item of input) {
    if (item.type === 'function_call') {
      messages.push({
        role: 'assistant',
        content: [{
          type: 'tool_use',
          id: item.id || item.call_id,
          name: item.name,
          input: safeParse(item.arguments) || {},
        }],
      });
    } else if (item.type === 'function_call_output') {
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: item.call_id,
          content: String(item.output),
        }],
      });
    } else if (item.role) {
      if (item.role === 'system') continue;
      const content = convertContent(item.content);
      if (content && (Array.isArray(content) ? content.length > 0 : content)) {
        const role = item.role === 'developer' ? 'user' : item.role;
        messages.push({ role, content });
      }
    }
  }
  
  return messages;
}

function convertContent(content) {
  if (typeof content === 'string') return content;
  
  if (Array.isArray(content)) {
    const converted = [];
    
    for (const part of content) {
      if (part.type === 'input_text' && part.text) {
        converted.push({ type: 'text', text: part.text });
      } else if (part.type === 'text' && part.text) {
        converted.push({ type: 'text', text: part.text });
      } else if (part.type === 'input_image') {
        if (part.image_url) {
          if (part.image_url.startsWith('data:')) {
            const match = part.image_url.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              converted.push({
                type: 'image',
                source: { type: 'base64', media_type: match[1], data: match[2] }
              });
            }
          } else {
            converted.push({ type: 'image', source: { type: 'url', url: part.image_url } });
          }
        }
      }
    }
    
    return converted.length > 0 ? converted : null;
  }
  
  return content;
}

function convertTools(tools) {
  return (tools || []).map(t => ({
    name: t.name || t.function?.name,
    description: t.description || '',
    input_schema: t.parameters || t.function?.parameters || { type: 'object', properties: {} },
  }));
}

function sendResponse(res, anthro, stream) {
  const responseId = anthro.id;
  const textContent = anthro.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
  const toolCalls = anthro.content?.filter(b => b.type === 'tool_use') || [];
  
  if (stream) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    
    sendSSE(res, 'response.created', {
      type: 'response.created',
      response: { id: responseId, object: 'response', status: 'in_progress', model: anthro.model }
    });
    
    let itemIndex = 0;
    
    if (textContent) {
      const itemId = 'msg_' + Date.now();
      
      sendSSE(res, 'response.output_item.added', {
        type: 'response.output_item.added', output_index: itemIndex,
        item: { type: 'message', id: itemId, role: 'assistant', status: 'in_progress' }
      });
      
      sendSSE(res, 'response.content_part.added', {
        type: 'response.content_part.added', output_index: itemIndex, content_index: 0,
        part: { type: 'text', text: '' }
      });
      
      sendSSE(res, 'response.content_part.done', {
        type: 'response.content_part.done', output_index: itemIndex, content_index: 0,
        part: { type: 'text', text: textContent }
      });
      
      sendSSE(res, 'response.output_item.done', {
        type: 'response.output_item.done', output_index: itemIndex,
        item: { type: 'message', id: itemId, role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: textContent }] }
      });
      
      itemIndex++;
    }
    
    for (const tool of toolCalls) {
      sendSSE(res, 'response.output_item.added', {
        type: 'response.output_item.added', output_index: itemIndex,
        item: { type: 'function_call', id: tool.id, call_id: tool.id, name: tool.name, status: 'completed' }
      });
      
      sendSSE(res, 'response.output_item.done', {
        type: 'response.output_item.done', output_index: itemIndex,
        item: { type: 'function_call', id: tool.id, call_id: tool.id, name: tool.name, arguments: JSON.stringify(tool.input), status: 'completed' }
      });
      
      itemIndex++;
    }
    
    const usage = anthro.usage || {};
    sendSSE(res, 'response.completed', {
      type: 'response.completed',
      response: {
        id: responseId, object: 'response',
        status: toolCalls.length > 0 ? 'in_progress' : 'completed',
        model: anthro.model,
        output: buildOutput(anthro),
        usage: { input_tokens: usage.input_tokens || 0, output_tokens: usage.output_tokens || 0, total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0) }
      }
    });
    
    res.end();
  } else {
    const usage = anthro.usage || {};
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      id: responseId, object: 'response',
      status: toolCalls.length > 0 ? 'in_progress' : 'completed',
      model: anthro.model,
      output: buildOutput(anthro),
      usage: { input_tokens: usage.input_tokens || 0, output_tokens: usage.output_tokens || 0, total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0) }
    }));
  }
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function buildOutput(anthro) {
  const output = [];
  for (const block of anthro.content || []) {
    if (block.type === 'text') {
      output.push({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: block.text }] });
    } else if (block.type === 'tool_use') {
      output.push({
        type: 'function_call', id: block.id, call_id: block.id,
        name: block.name, arguments: JSON.stringify(block.input), status: 'completed',
      });
    }
  }
  return output;
}

function safeParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 DashScope Proxy for Codex CLI`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Target: ${DASHSCOPE_URL}`);
  console.log(`✅ Ready\n`);
});
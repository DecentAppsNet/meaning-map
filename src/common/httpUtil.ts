/* v8 ignore start */

export async function fetchGetText(url:string):Promise<string> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });
  if (res.ok) return await res.text();
  const text = await res.text();
  throw new Error(`Error ${res.status}: ${text}`);
}

export async function fetchGetJson(url:string):Promise<any> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json'}
  });
  if (res.ok) return await res.json();
  const text = await res.text();
  throw new Error(`Error ${res.status}: ${text}`);
}

export async function fetchJsonWithAuth(url:string, bearerToken:string, body:unknown):Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return res.json();
  const text = await res.text();
  throw new Error(`Error ${res.status}: ${text}`);
}

/* v8 ignore end */
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export function subscribe(matchId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(matchId)) {
    connections.set(matchId, new Set());
  }
  connections.get(matchId)!.add(controller);
}

export function unsubscribe(matchId: string, controller: ReadableStreamDefaultController) {
  connections.get(matchId)?.delete(controller);
  if (connections.get(matchId)?.size === 0) {
    connections.delete(matchId);
  }
}

export function broadcast(matchId: string, data: unknown) {
  const controllers = connections.get(matchId);
  if (!controllers || controllers.size === 0) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  for (const controller of controllers) {
    try {
      controller.enqueue(encoded);
    } catch {
      controllers.delete(controller);
    }
  }
}

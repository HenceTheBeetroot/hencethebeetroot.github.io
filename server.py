import http.server
import socketserver

PORT = 8080

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
  ".js" : "application/javascript",
})

httpd = socketserver.TCPServer(("", PORT), Handler)
print("opening server")
httpd.serve_forever()
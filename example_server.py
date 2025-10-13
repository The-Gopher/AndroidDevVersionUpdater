#!/usr/bin/env python3
"""
Example API server for AndroidDevVersionUpdater

This script provides a simple HTTP server that serves the example API response.
You can use this for testing the app or as a template for your own API server.

Usage:
    python example_server.py [port]

Default port is 8000.

Generate a QR code for the URL:
    qrencode -o qr.png "http://YOUR_IP:8000/streams"
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path


class StreamsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Load the example response
        example_file = Path(__file__).parent / "example_api_response.json"
        
        if self.path == "/streams" or self.path == "/":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            with open(example_file, 'r') as f:
                response_data = f.read()
            
            self.wfile.write(response_data.encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    
    server = HTTPServer(('0.0.0.0', port), StreamsHandler)
    print(f"Starting server on port {port}")
    print(f"API endpoint: http://localhost:{port}/streams")
    print(f"\nGenerate QR code with:")
    print(f"  qrencode -o qr.png 'http://YOUR_IP:{port}/streams'")
    print(f"\nPress Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()


if __name__ == '__main__':
    main()

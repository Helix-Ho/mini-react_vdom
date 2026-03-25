from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent / "output" / "verify"
REPORT_PATH = ROOT / "report.json"


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/report":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        payload = self.rfile.read(content_length)
        ROOT.mkdir(parents=True, exist_ok=True)
        REPORT_PATH.write_bytes(payload)

        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    server = HTTPServer(("127.0.0.1", 4174), Handler)
    server.serve_forever()

# SpedFind Core Speed Test Logic
# Uses only open-source libraries (speedtest-cli)

import speedtest

def run_speedtest():
    s = speedtest.Speedtest()
    s.get_best_server()
    download = s.download()
    upload = s.upload()
    ping = s.results.ping
    return {
        'download': download,
        'upload': upload,
        'ping': ping,
        'server': s.results.server,
        'timestamp': s.results.timestamp
    }

if __name__ == "__main__":
    results = run_speedtest()
    print(results)

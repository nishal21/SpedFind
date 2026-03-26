import sys
import time
import httpx
import speedtest
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.layout import Layout
from rich.live import Live
from rich.text import Text
from rich.align import Align
from rich.spinner import Spinner
from rich import box

console = Console()

def get_client_info():
    """Fetch exact client IP and Geography using ipinfo.io"""
    try:
        res = httpx.get('https://ipinfo.io/json', timeout=5.0).json()
        org = res.get('org', 'Unknown Provider')
        # Clean AS number
        if org.startswith('AS'):
            org = ' '.join(org.split(' ')[1:])
        return {
            'ip': res.get('ip', 'Unknown'),
            'city': res.get('city', 'Unknown'),
            'region': res.get('region', 'Unknown'),
            'country': res.get('country', '--'),
            'loc': res.get('loc', '0.0000, 0.0000'),
            'org': org,
            'asn': res.get('org', 'AS0000').split(' ')[0] if 'AS' in res.get('org', '') else 'AS0000'
        }
    except Exception:
        pass

    try:
        res = httpx.get('http://ip-api.com/json/', timeout=5.0).json()
        return {
            'ip': res.get('query', 'Unknown'),
            'city': res.get('city', 'Unknown'),
            'region': res.get('regionName', 'Unknown'),
            'country': res.get('country', '--'),
            'loc': f"{res.get('lat', '0')}, {res.get('lon', '0')}",
            'org': res.get('isp', 'Unknown Provider'),
            'asn': res.get('as', 'AS0000').split(' ')[0] if 'as' in res else 'AS0000'
        }
    except Exception:
        return {
            'ip': 'Offline', 'city': '--', 'region': '--', 
            'country': '--', 'loc': '--', 'org': 'Network Error', 'asn': '--'
        }

def evaluate_network(down, up, ping):
    """Assigns a Network Grade"""
    if down >= 500 and up >= 100 and ping <= 15:
        return "[bold bright_green]S[/] (Enterprise Fiber)"
    elif down >= 100 and up >= 20 and ping <= 30:
        return "[bold green]A[/] (Excellent Broadband)"
    elif down >= 25 and up >= 5 and ping <= 80:
        return "[bold cyan]B[/] (Good Connection)"
    elif down >= 10 and up >= 1 and ping <= 150:
        return "[bold yellow]C[/] (Usable/Average)"
    else:
        return "[bold red]F[/] (Severely Degraded)"

def generate_hud(status_msg, ping_val, down_val, up_val, client_info, server_info, grade=None):
    """Generates the Rich Dashboard Layout"""
    
    # Header
    header = Text()
    header.append(" SPEDFIND. ", style="bold white on black")
    header.append(" PRO-GRADE NETWORK DIAGNOSTICS ", style="bold bright_black on black")
    header_panel = Panel(Align.center(header), box=box.SQUARE, style="cyan")

    # Metrics Row
    metrics_table = Table(box=box.MINIMAL_DOUBLE_HEAD, show_header=False, expand=True)
    metrics_table.add_column("Ping", justify="center", ratio=1)
    metrics_table.add_column("Download", justify="center", ratio=1)
    metrics_table.add_column("Upload", justify="center", ratio=1)
    
    metrics_table.add_row(
        Text("LATENCY (ms)", style="bold bright_black"),
        Text("DOWNSTREAM (Mbps)", style="bold bright_black"),
        Text("UPSTREAM (Mbps)", style="bold bright_black")
    )
    
    ping_text = Text(f"{ping_val:.1f}" if ping_val else "--", style="bold cyan text_align_center")
    ping_text.stylize("reverse" if status_msg == "Pinging Server..." else "")
    
    down_text = Text(f"{down_val:.2f}" if down_val else "--", style="bold green text_align_center")
    down_text.stylize("reverse" if status_msg == "Testing Download..." else "")
    
    up_text = Text(f"{up_val:.2f}" if up_val else "--", style="bold magenta text_align_center")
    up_text.stylize("reverse" if status_msg == "Testing Upload..." else "")

    metrics_table.add_row(ping_text, down_text, up_text)
    
    if grade:
        metrics_table.add_row("", "", "")
        metrics_table.add_row(
            Text("NETWORK GRADE:", style="bold bright_black"),
            Text.from_markup(grade, justify="center"),
            ""
        )

    metrics_panel = Panel(metrics_table, title=f"[bold white]{status_msg}[/]", border_style="bright_black")

    # Footer Row (Client / Server)
    footer_table = Table(box=None, show_header=False, expand=True)
    footer_table.add_column("Client", ratio=1)
    footer_table.add_column("Server", justify="right", ratio=1)

    client_txt = f"[bold white]{client_info['org']}[/]\n" \
                 f"[cyan]{client_info['ip']}[/] | [bright_black]{client_info['asn']}[/]\n" \
                 f"[bright_black]{client_info['city']}, {client_info['region']} ({client_info['country']})[/]"

    server_txt = f"[bold white]{server_info.get('sponsor', '--')}[/]\n" \
                 f"[cyan]{server_info.get('host', '--')}[/]\n" \
                 f"[bright_black]{server_info.get('name', '--')}, {server_info.get('country', '--')}[/]"

    footer_table.add_row(client_txt, server_txt)
    footer_panel = Panel(footer_table, title="[bold bright_black]ROUTING VECTOR[/]", border_style="bright_black")

    layout = Layout()
    layout.split(
        Layout(header_panel, size=3),
        Layout(metrics_panel, size=10 if not grade else 12),
        Layout(footer_panel, size=6)
    )
    
    return layout

def main():
    try:
        with Live(generate_hud("Initializing Engine...", 0, 0, 0, get_client_info(), {}), refresh_per_second=4) as live:
            
            # 1. Fetch Client Info
            live.update(generate_hud("Fetching Identity Vector...", 0, 0, 0, {'org':'--','ip':'--','asn':'--','city':'--','region':'--','country':'--'}, {}))
            client_info = get_client_info()
            
            # 2. Init Speedtest
            live.update(generate_hud("Connecting to Core Nodes...", 0, 0, 0, client_info, {}))
            st = speedtest.Speedtest()
            
            # 3. Best Server & Ping
            st.get_best_server()
            server_info = st.results.server
            
            live.update(generate_hud("Pinging Server...", 0, 0, 0, client_info, server_info))
            ping_val = server_info['latency']
            time.sleep(0.5) # UI flourish
            
            # 4. Download
            live.update(generate_hud("Testing Download...", ping_val, 0, 0, client_info, server_info))
            
            # Use callback to get live download speed updates
            def dl_cb(bytes_received, total, **kwargs):
                pass # Speedtest-cli doesn't easily support simple mbps callbacks without deep hooks.

            down_bps = st.download(threads=None) # Use default threads
            down_mbps = down_bps / 1000000
            
            # 5. Upload
            live.update(generate_hud("Testing Upload...", ping_val, down_mbps, 0, client_info, server_info))
            up_bps = st.upload(threads=None, pre_allocate=False)
            up_mbps = up_bps / 1000000
            
            # 6. Evaluation
            grade = evaluate_network(down_mbps, up_mbps, ping_val)
            
            # Final Print
            live.update(generate_hud("Diagnostics Complete", ping_val, down_mbps, up_mbps, client_info, server_info, grade))

    except Exception as e:
        console.print(f"[bold red]Critical Error:[/bold red] {e}")

if __name__ == "__main__":
    main()

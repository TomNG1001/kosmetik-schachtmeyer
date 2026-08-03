$port = if ($env:PORT) { [int]$env:PORT } else { 3470 }
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        $path = $req.Url.LocalPath -replace '/', '\'
        if ($path -eq '\') { $path = '\index.html' }
        $file = Join-Path $root $path.TrimStart('\')

        if (Test-Path $file -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($file).ToLower()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css' }
                '.js'   { 'application/javascript' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.webp' { 'image/webp' }
                '.svg'  { 'image/svg+xml' }
                '.mp4'  { 'video/mp4' }
                '.woff2' { 'font/woff2' }
                '.ico'  { 'image/x-icon' }
                default { 'application/octet-stream' }
            }
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.Length
            $cache = switch ($ext) {
                { $_ -in '.html', '.css', '.js' } { 'no-cache' }
                { $_ -in '.woff2', '.mp4', '.jpg', '.png', '.webp' } { 'public, max-age=31536000, immutable' }
                default { 'public, max-age=86400' }
            }
            $res.Headers.Add('Cache-Control', $cache)
            if ($req.HttpMethod -ne 'HEAD') {
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $res.StatusCode = 404
        }
        $res.OutputStream.Close()
    } catch {
        try { $res.Abort() } catch {}
    }
}

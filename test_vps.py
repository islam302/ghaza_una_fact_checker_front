"""
اختبار VPS API - اختبار الطلبات المتزامنة (Concurrent Requests)
الاستخدام: 
    python test_vps.py              # 10 طلبات متزامنة
    python test_vps.py --concurrent 50  # 50 طلب متزامن
    python test_vps.py --concurrent 100 --total 200  # 200 طلب إجمالي، 100 متزامن
"""

import requests
import time
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# إعدادات الـ VPS
VPS_URL = "http://62.72.22.223"
ENDPOINT = "/fact_check/"

# إعدادات الاختبار الافتراضية
DEFAULT_CONCURRENT = 10  # عدد الطلبات المتزامنة
DEFAULT_TOTAL = 100  # إجمالي عدد الطلبات

# إحصائيات
stats = {
    "total": 0,
    "success": 0,
    "failed": 0,
    "errors": [],
    "times": [],
    "start_time": None,
    "end_time": None
}


def send_request(request_id: int, timeout: int = 120):
    """إرسال طلب واحد"""
    url = f"{VPS_URL}{ENDPOINT}"
    payload = {"query": f"مظاهرات في القاهرة اليوم - Request #{request_id}"}
    headers = {"Content-Type": "application/json"}
    
    start_time = time.time()
    
    try:
        # زيادة timeout إلى 120 ثانية (دقيقتين)
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
        elapsed = time.time() - start_time
        
        stats["total"] += 1
        stats["times"].append(elapsed)
        
        if response.status_code == 200:
            stats["success"] += 1
            print(f"✅ Request #{request_id}: {response.status_code} ({elapsed:.2f}s)")
        else:
            stats["failed"] += 1
            error_msg = f"Request #{request_id}: {response.status_code} - {response.text[:100]}"
            stats["errors"].append(error_msg)
            print(f"❌ {error_msg}")
            
    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        stats["total"] += 1
        stats["failed"] += 1
        error_msg = f"Request #{request_id}: Timeout after {elapsed:.2f}s (exceeded {timeout}s)"
        stats["errors"].append(error_msg)
        print(f"⏱️  {error_msg}")
    except requests.exceptions.ConnectionError as e:
        elapsed = time.time() - start_time
        stats["total"] += 1
        stats["failed"] += 1
        error_msg = f"Request #{request_id}: Connection Error - {str(e)}"
        stats["errors"].append(error_msg)
        print(f"🔌 {error_msg}")
    except Exception as e:
        elapsed = time.time() - start_time
        stats["total"] += 1
        stats["failed"] += 1
        error_msg = f"Request #{request_id}: Error - {str(e)}"
        stats["errors"].append(error_msg)
        print(f"❌ {error_msg}")


def run_test(concurrent: int = DEFAULT_CONCURRENT, total: int = DEFAULT_TOTAL, timeout: int = 120):
    """تشغيل الاختبار - طلبات متزامنة"""
    print("="*70)
    print("🚀 Starting Concurrent Load Test")
    print(f"📡 Target: {VPS_URL}{ENDPOINT}")
    print(f"🔄 Concurrent Requests: {concurrent}")
    print(f"📤 Total Requests: {total}")
    print(f"⏱️  Timeout per request: {timeout}s")
    print("="*70)
    
    stats["start_time"] = datetime.now()
    
    # استخدام ThreadPoolExecutor لإرسال الطلبات المتزامنة
    with ThreadPoolExecutor(max_workers=concurrent) as executor:
        # إرسال جميع الطلبات دفعة واحدة (متزامنة)
        futures = [executor.submit(send_request, i+1, timeout) for i in range(total)]
        
        # انتظار اكتمال جميع الطلبات
        completed = 0
        for future in as_completed(futures):
            try:
                future.result()
                completed += 1
                if completed % 10 == 0:
                    print(f"📊 Progress: {completed}/{total} requests completed")
            except Exception as e:
                print(f"❌ Future error: {e}")
    
    stats["end_time"] = datetime.now()
    
    # طباعة الإحصائيات
    print_results(concurrent)


def print_results(concurrent: int):
    """طباعة نتائج الاختبار"""
    duration = (stats["end_time"] - stats["start_time"]).total_seconds()
    
    print("\n" + "="*70)
    print("📊 Test Results")
    print("="*70)
    print(f"🔄 Concurrent Requests: {concurrent}")
    print(f"⏱️  Total Duration: {duration:.2f} seconds")
    print(f"📤 Total Requests: {stats['total']}")
    print(f"✅ Successful: {stats['success']} ({stats['success']/stats['total']*100:.1f}%)")
    print(f"❌ Failed: {stats['failed']} ({stats['failed']/stats['total']*100:.1f}%)")
    
    if stats["times"]:
        avg_time = sum(stats["times"]) / len(stats["times"])
        min_time = min(stats["times"])
        max_time = max(stats["times"])
        
        # حساب النسب المئوية
        sorted_times = sorted(stats["times"])
        p50 = sorted_times[len(sorted_times) // 2]
        p95 = sorted_times[int(len(sorted_times) * 0.95)]
        p99 = sorted_times[int(len(sorted_times) * 0.99)]
        
        print(f"\n⏱️  Response Times:")
        print(f"   Average: {avg_time:.2f}s")
        print(f"   Min: {min_time:.2f}s")
        print(f"   Max: {max_time:.2f}s")
        print(f"   P50 (Median): {p50:.2f}s")
        print(f"   P95: {p95:.2f}s")
        print(f"   P99: {p99:.2f}s")
        
        # حساب requests per second الفعلية
        actual_rps = stats["total"] / duration if duration > 0 else 0
        print(f"\n📈 Throughput: {actual_rps:.2f} requests/second")
        
        # تقييم الأداء
        print(f"\n💡 Performance Assessment:")
        if avg_time < 5:
            print(f"   ✅ Excellent! Average response time is {avg_time:.2f}s")
        elif avg_time < 10:
            print(f"   ⚠️  Good, but could be better. Average response time is {avg_time:.2f}s")
        else:
            print(f"   ❌ Slow! Average response time is {avg_time:.2f}s - VPS may be overloaded")
        
        if stats["failed"] / stats["total"] > 0.1:
            print(f"   ⚠️  High failure rate ({stats['failed']/stats['total']*100:.1f}%) - VPS may be at capacity")
        else:
            print(f"   ✅ Low failure rate - VPS handling load well")
    
    if stats["errors"]:
        print(f"\n❌ Errors ({len(stats['errors'])}):")
        for error in stats["errors"][:10]:  # عرض أول 10 أخطاء فقط
            print(f"   {error}")
        if len(stats["errors"]) > 10:
            print(f"   ... and {len(stats['errors']) - 10} more errors")
    
    print("="*70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test VPS concurrent capacity")
    parser.add_argument("--concurrent", type=int, default=DEFAULT_CONCURRENT,
                       help=f"Number of concurrent requests (default: {DEFAULT_CONCURRENT})")
    parser.add_argument("--total", type=int, default=DEFAULT_TOTAL,
                       help=f"Total number of requests (default: {DEFAULT_TOTAL})")
    parser.add_argument("--timeout", type=int, default=120,
                       help="Timeout per request in seconds (default: 120)")
    
    args = parser.parse_args()
    
    # إعادة تعيين الإحصائيات
    stats = {
        "total": 0,
        "success": 0,
        "failed": 0,
        "errors": [],
        "times": [],
        "start_time": None,
        "end_time": None
    }
    
    try:
        run_test(concurrent=args.concurrent, total=args.total, timeout=args.timeout)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        print_results(args.concurrent)
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print_results(args.concurrent)


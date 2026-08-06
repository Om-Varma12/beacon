import redis

print(redis.__version__)

r = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    socket_timeout=None,
    socket_connect_timeout=None,
)

result = r.brpop("beacon:jobs", timeout=30)

print(result)
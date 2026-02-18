from flask import Flask, request, jsonify
import base64
import random
import string

app = Flask(__name__)

VALID_KEYS = ["TATANG-PRO-2026"]

def random_var():
    return ''.join(random.choices(string.ascii_letters, k=10))

def xor_encrypt(data, key):
    return ''.join(chr(ord(c) ^ key) for c in data)

def obfuscate(code):

    xor_key = random.randint(1,9)

    xor_data = xor_encrypt(code, xor_key)

    encoded = base64.b64encode(xor_data.encode()).decode()

    v1 = random_var()
    v2 = random_var()
    v3 = random_var()

    wrapper = f"""
local {v1}="{encoded}";
local function {v2}(data)
local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
data=string.gsub(data,'[^'..b..'=]','')
return (data:gsub('.',function(x)
if(x=='=')then return'' end
local r,f='',(b:find(x)-1)
for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and'1'or'0') end
return r;
end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x)
if(#x~=8)then return'' end
local c=0
for i=1,8 do
c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0)
end
return string.char(c)
end))
end;

local {v3}={v2}({v1});

local decoded=""
for i=1,#{v3} do
decoded=decoded..string.char(string.byte({v3},i)~{xor_key})
end

load(decoded)();
"""

    return wrapper.replace("\n","")

@app.route("/obfuscate", methods=["POST"])
def api():

    data = request.json

    key = data.get("key")
    code = data.get("code")

    if key not in VALID_KEYS:
        return jsonify({"error":"invalid key"}),403

    result = obfuscate(code)

    return jsonify({"result":result})

@app.route("/")
def home():
    return "TATANG OBFUSCATOR API ONLINE"

if __name__ == "__main__":
    app.run()

var storage = {
    set: function(key, val) {
        if (typeof val === 'object') {
            val = JSON.stringify(val);
        }
        return localStorage.setItem(key, val);
    },
    get: function(key, flag) {
        var val = localStorage.getItem(key);
        if (flag) {
            if (val === '{}') {
                return null;
            } else {
                val = JSON.parse(val);
            }
        }
        return val;
    }
};
function V2(x, y) {
    this.x = x || 0;
    this.y = y || 0;
};
V2.prototype.sub = function(v) {
    if (!v) {
        return this;
    }
    return new V2(this.x - v.x, this.y - v.y);
};
V2.prototype.add = function(v) {
    if (!v) {
        return this;
    }
    return new V2(this.x + v.x, this.y + v.y);
};
V2.prototype.mul = function(k) {
    if (!k) {
        return this;
    }
    if (k.hasOwnProperty('x')) {
        return new V2(this.x * k.x, this.y * k.y);    
    }
    return new V2(this.x * k, this.y * k);
};
V2.prototype.mag = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
};
V2.prototype.rotate = function(ang, ori) {
    ori = ori || new V2();
    var rad = utils.AngToRad(ang);
    var src = this.sub(ori);
    var dst = new V2(src.x*Math.cos(rad) - src.y*Math.sin(rad), src.x*Math.sin(rad) + src.y*Math.cos(rad));
    return dst.add(ori);
};

var utils = {
    radToAng: function(rad){
        return rad*180/Math.PI;
    },
    AngToRad: function(ang){
        return ang*Math.PI/180;
    },
    /**
    * 获取线段AB的k比例点，默认为1/2中点
    * @param {*} a 
    * @param {*} b 
    * @param {*} k 
    */
    getCenterPoint: function(a, b, k=0.5) {
        return a.add(b.sub(a).mul(k));
    },

    /**
    * 获取以c点为起点，以向量ab的平移的终点
    * @param {*} a 
    * @param {*} b 
    * @param {*} c 
    */
    getTransionPoint: function(a, b, c, smooth) {
        return c.add(b.sub(a).mul(smooth));
    },

    /**
    * 计算Bezier控制点
    * @param {*} from 
    * @param {*} to 
    * @param {*} prev 
    * @param {*} next 
    */
    getBezierControlPoint: function(from, to, prev, next, smooth) {
        var p1 = this.getCenterPoint(prev, from);
        var p2 = this.getCenterPoint(from, to);
        var p3 = this.getCenterPoint(to, next);

        // 使用垂足,不理想
        // this.getFootPoint(p1, p2, from, f1);
        // this.getFootPoint(p2, p3, to, f2);

        // 使用中点,不理想
        // f1 = this.getCenterPoint(p1, p2);
        // f2 = this.getCenterPoint(p2, p3);

        // 使用中点距离的比例点
        var len1 = prev.sub(from).mag();
        var len2 = from.sub(to).mag();
        var len3 = to.sub(next).mag();
        var f1 = this.getCenterPoint(p1, p2, len1/(len1+len2));
        var f2 = this.getCenterPoint(p2, p3, len2/(len2+len3));
        // 以比例点左平移 
        return [this.getTransionPoint(f1, p2, from, smooth), this.getTransionPoint(f2, p2, to, smooth)];
    },
    /**
    * 判断目标点P是否在Bezier曲线(p1,p2,p3,p4)上
    * @param {起点} p1 
    * @param {控制点1} p2 
    * @param {控制点2} p3 
    * @param {终点} p4 
    * @param {待判断点} p 
    * @param {步长} step 
    * @param {误差} range 
    * @return Bezier曲线的选中点
    */
    isBezierPoint: function(p1, p2, p3, p4, p, step=0.005, range=0.5) {
        var flag = false;
        // step = 0.02;
        // main.ctx.beginPath();
        for (var t=0; t<1; t+=step) {
            var x = p1.x*Math.pow(1-t, 3) + 3*p2.x*t*Math.pow(1-t, 2) + 3*p3.x*Math.pow(t, 2)*(1-t) + p4.x*Math.pow(t, 3);
            var y = p1.y*Math.pow(1-t, 3) + 3*p2.y*t*Math.pow(1-t, 2) + 3*p3.y*Math.pow(t, 2)*(1-t) + p4.y*Math.pow(t, 3);
            // main.ctx.moveTo(x, y);
            // main.ctx.arc(x, y, 5, 0, Math.PI*2);
            // main.ctx.fill();
            if (Math.pow(x-p.x, 2) + Math.pow(y-p.y, 2) <= range*range) {
                return true;
                // flag = true;
            }
        }
        // main.ctx.closePath();
        return flag;
    },
    /**
    * 计算t时刻Bezier曲线上的点
    * @param {起点} p1 
    * @param {控制点1} p2 
    * @param {控制点2} p3 
    * @param {终点} p4 
    * @param {时刻0-1} t 
    * @return Bezier曲线的选中点
    */
    getBezierPoint: function(p1, p2, p3, p4, t) {
        return {
            x: p1.x*Math.pow(1-t, 3) + 3*p2.x*t*Math.pow(1-t, 2) + 3*p3.x*Math.pow(t, 2)*(1-t) + p4.x*Math.pow(t, 3),
            y: p1.y*Math.pow(1-t, 3) + 3*p2.y*t*Math.pow(1-t, 2) + 3*p3.y*Math.pow(t, 2)*(1-t) + p4.y*Math.pow(t, 3)
        };
    },
    clone: function(obj) {
        let buf;
        if (obj instanceof Array) {
            buf = [];
            let l = obj.length;
            while (l--) {
                buf[l] = this.clone(obj[l]);
            }
            return buf;
        }
        else if (obj instanceof Object) {
            buf = {};
            for (let i in obj) {
                if (i === 'this' || i === '__proto__') {
                    continue;
                }
                buf[i] = this.clone(obj[i]);
            }
            return buf;
        }
        else {
            return obj;
        }
    },
    importFromBinary: function(file, cb) {
        // todo convert to protobuf
        var reader = new FileReader();
        reader.onload = function() {
            var data = Proto.decode('FishPath_Config', new Uint8Array(this.result));
            cb(data);
        }
        reader.readAsArrayBuffer(file);
    },
    exportBinary: function(data, name) {
        // todo convert to protobuf
        var data = Proto.encode('FishPath_Config', data);
        var blob = new Blob([data], {type: 'plain/text'});
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
            window.navigator.msSaveBlob(blob, fileName);
            return true;
        }
        var URL = window.URL || window.webkitURL;
        var objectUrl = URL.createObjectURL(blob);
        var a = window.document.createElement("a");
        if (typeof a.download === 'undefined') {
            window.location = objectUrl;
        } else {
            a.href = objectUrl;
            a.download = name+".protobuf";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    },
    exportJson: function(data, name) {
        var uri = 'data:text/json;charset=utf-8,\ufeff' + encodeURIComponent(JSON.stringify(data, undefined, 4));
        var a = window.document.createElement("a");
        a.href = uri;
        a.download = name+".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
    },
    fillZero: function(num) {
        return num>=10 ? num+'' : '0'+num;
    }
};
var modal = {
    alert: function(content, okFn) {

    },
    conform: function(content, okFn, cancelFn) {

    },
    show: function(conf) {
        var config = {
            title: conf.title || 'some title here',
            content: conf.content || 'some content here',
            offset: conf.offset || null,
            ok: conf.ok || this.onOK,
            cancel: conf.cancel || this.onCancel,
            close: conf.close || this.onClose,
            shown: conf.shown || this.onShown,
        };
        
    },
};
var Proto = {
    init: function() {
        protobuf.load('./data.proto', function(err, root) {
            if (err) {
                console.error(err);
                console.log('Proto文件载入失败');
                return false;
            }
            Proto.root = root;
        });
    },
    root: null,
    ver: 1,
    encode: function (struct, data) {
        var Message = this.root.lookupType("FishPath." + struct);
        var errMsg = Message.verify(data);
        if (errMsg) {
            throw new Error(errMsg);
        }
        var message = Message.fromObject(data); // or use .fromObject if conversion is necessary
        return Message.encode(message).finish();
    },
    decode: function (struct, buf) {
        var Message = this.root.lookupType("FishPath." + struct);
        var data = Message.decode(buf);
        return Message.toObject(data, {
            longs: String,
            // enums: String,
            bytes: String,
        });
    },
};
Proto.init();
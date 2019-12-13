var ՐՏ_1, ՐՏ_2, ՐՏ_3;
function ՐՏ_bind(fn, thisArg) {
    var ret;
    if (fn.orig) {
        fn = fn.orig;
    }
    if (thisArg === false) {
        return fn;
    }
    ret = function() {
        return fn.apply(thisArg, arguments);
    };
    ret.orig = fn;
    return ret;
}
function ՐՏ_extends(child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.__base__ = parent;
    child.prototype.constructor = child;
}
function ՐՏ_in(val, arr) {
    if (typeof arr.indexOf === "function") {
        return arr.indexOf(val) !== -1;
    } else if (typeof arr.has === "function") {
        return arr.has(val);
    }
    return arr.hasOwnProperty(val);
}
function ՐՏ_Iterable(iterable) {
    var tmp;
    if (iterable.constructor === [].constructor || iterable.constructor === "".constructor || (tmp = Array.prototype.slice.call(iterable)).length) {
        return tmp || iterable;
    }
    if (Set && iterable.constructor === Set) {
        return Array.from(iterable);
    }
    return Object.keys(iterable);
}
function len(obj) {
    var tmp;
    if (obj.constructor === [].constructor || obj.constructor === "".constructor || (tmp = Array.prototype.slice.call(obj)).length) {
        return (tmp || obj).length;
    }
    if (Set && obj.constructor === Set) {
        return obj.size;
    }
    return Object.keys(obj).length;
}
function range(start, stop, step) {
    var length, idx, range;
    if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
    }
    step = arguments[2] || 1;
    length = Math.max(Math.ceil((stop - start) / step), 0);
    idx = 0;
    range = new Array(length);
    while (idx < length) {
        range[idx++] = start;
        start += step;
    }
    return range;
}
function ՐՏ_eq(a, b) {
    var ՐՏitr3, ՐՏidx3;
    var i;
    if (a === b) {
        return true;
    }
    if (a === void 0 || b === void 0 || a === null || b === null) {
        return false;
    }
    if (a.constructor !== b.constructor) {
        return false;
    }
    if (Array.isArray(a)) {
        if (a.length !== b.length) {
            return false;
        }
        for (i = 0; i < a.length; i++) {
            if (!ՐՏ_eq(a[i], b[i])) {
                return false;
            }
        }
        return true;
    } else if (a.constructor === Object) {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
        ՐՏitr3 = ՐՏ_Iterable(a);
        for (ՐՏidx3 = 0; ՐՏidx3 < ՐՏitr3.length; ՐՏidx3++) {
            i = ՐՏitr3[ՐՏidx3];
            if (!ՐՏ_eq(a[i], b[i])) {
                return false;
            }
        }
        return true;
    } else if (Set && a.constructor === Set || Map && a.constructor === Map) {
        if (a.size !== b.size) {
            return false;
        }
        for (i of a) {
            if (!b.has(i)) {
                return false;
            }
        }
        return true;
    } else if (a.constructor === Date) {
        return a.getTime() === b.getTime();
    } else if (typeof a.__eq__ === "function") {
        return a.__eq__(b);
    }
    return false;
}

var __name__ = "__main__";
var __version__, CACHE_SIZE, TABLE_SEPERATOR, UNICODE_REGION, NUMS_ZH;
'\nSearch Chinese text using InputMethod initials\n\nCopyright (C) 2016 copyright <mozbugbox@yahoo.com.au>\n\nThis program is free software; you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation; either version 2 of the License, or\n(at your option) any later version.\n\nThis program is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License\nalong with this program; if not, see <http://www.gnu.org/licenses/>.\n\nUsage:\n    im_matcher = create_matcher(im_data_json)\n    txt = "红花不是,随便的花草鱼虫"\n    index = im_matcher.find(txt, "hh")\n    if index >= 0:\n        print("found")\n    else:\n        print("not found")\n';
__version__ = "0.2";
CACHE_SIZE = 512;
TABLE_SEPERATOR = "|";
UNICODE_REGION = {
    "hani_comp": [ 63744, 64255 ],
    "hani_comp_sup": [ 194560, 195103 ],
    "hani_bmp": [ 19968, 40959 ],
    "hani_exta": [ 13312, 19903 ],
    "hani_extb": [ 131072, 173791 ],
    "hani_extc": [ 173824, 177983 ],
    "hani_extd": [ 177984, 178207 ],
    "hani_exte": [ 178208, 183983 ]
};
NUMS_ZH = "零一二三四五六七八九";
var decode_im_table = (ՐՏ_1 = function decode_im_table(im_table_data) {
    var result, im_list;
    function _expand_rle(seg) {
        return seg[seg.length - 1].repeat(seg.slice(0, seg.length - 1));
    }
    result = im_table_data.replace(new RegExp("\\d+[A-Za-z" + TABLE_SEPERATOR + "]", "g"), _expand_rle);
    function _expand_sep(m) {
        return m.toLowerCase() + TABLE_SEPERATOR;
    }
    result = result.replace(/[A-Z]/g, _expand_sep, result);
    im_list = result.split(TABLE_SEPERATOR);
    return im_list;
}, Object.defineProperty(ՐՏ_1, "__doc__", {
    value: "decode a string of im_table to list of im codes"
}), ՐՏ_1);
var IMMatcher = (ՐՏ_2 = class IMMatcher {
    im_table: any;
    constructor (im_table_dict=null) {
        var ՐՏitr1, ՐՏidx1;
        var self = this;
        var k, v;
        self.im_table = null;
        if (im_table_dict !== null) {
            self.im_table = {};
            ՐՏitr1 = ՐՏ_Iterable(im_table_dict);
            for (ՐՏidx1 = 0; ՐՏidx1 < ՐՏitr1.length; ՐՏidx1++) {
                k = ՐՏitr1[ՐՏidx1];
                v = im_table_dict[k];
                self.im_table[k] = decode_im_table(v);
            }
        }
    }
    match_charcode_region (tcode, key_char, reg) {
        var self = this;
        var ret, start, end;
        ret = false;
        [start, end] = UNICODE_REGION[reg];
        if (start <= tcode && tcode <= end) {
            ret = ՐՏ_in(key_char, self.im_table[reg][tcode - start]);
        }
        if (typeof ret === "undefined") {
            ret = false;
        }
        return ret;
    }
    match_char (target, key_char) {
        var ՐՏitr2, ՐՏidx2;
        var self = this;
        var tcode, im_table, match_charcode_region, region, res;
        if (target === key_char) {
            return true;
        }
        if (self.im_table === null) {
            return false;
        }
        if ("0" <= target && target <= "9") {
            target = NUMS_ZH[parseInt(target, 10)];
        }
        tcode = target.charCodeAt(0);
        im_table = self.im_table;
        match_charcode_region = ՐՏ_bind(self.match_charcode_region, self);
        ՐՏitr2 = ՐՏ_Iterable(im_table);
        for (ՐՏidx2 = 0; ՐՏidx2 < ՐՏitr2.length; ՐՏidx2++) {
            region = ՐՏitr2[ՐՏidx2];
            res = match_charcode_region(tcode, key_char, region);
            if (res) {
                break;
            }
        }
        return res;
    }
    find (txt, sub, start=0, end=null) {
        var self = this;
        var matched, sub_len, match_char, n, i;
        if (end === null) {
            end = len(txt);
        } else if (end < 0) {
            end = len(txt) + end;
        }
        matched = txt.indexOf(sub, start, end);
        if (matched >= 0) {
            return matched;
        }
        if (self.im_table === null) {
            return -1;
        }
        sub_len = len(sub);
        match_char = ՐՏ_bind(self.match_char, self);
        for (n = start; n < end - sub_len + 1; n++) {
            matched = n;
            for (i = 0; i < sub_len; i++) {
                if (!match_char(txt[n + i], sub[i])) {
                    matched = -1;
                    break;
                }
            }
            if (matched >= 0) {
                break;
            }
        }
        return matched;
    }
    contain (txt, sub) {
        var self = this;
        return self.find(txt, sub) >= 0;
    }
}, (function(){
    Object.defineProperties(ՐՏ_2.prototype, {
        __doc__: {
            enumerable: true, 
            writable: true, 
            value: "Search Chinese text using InputMethod initials"
        }
    });
    ;
})(), ՐՏ_2);
var create_matcher = (ՐՏ_3 = function create_matcher(im_data_json) {
    var im_dict, matcher;
    im_dict = JSON.parse(im_data_json);
    matcher = new IMMatcher(im_dict["im_table"]);
    return matcher;
}, Object.defineProperty(ՐՏ_3, "__doc__", {
    value: "Create a IMMatcher from im data in json"
}), ՐՏ_3);
export {create_matcher, IMMatcher};
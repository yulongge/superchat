'use strict'

var Q = require('q');
var pool = require('./client');

exports.findUsersByPage = function (pageNo, pageSize) {
    console.log('in findUsersByPage...');
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        console.log('getConnection...');
        conn.query("select count(*) as u from wx_user", function (err, ret) {
            if (err) {
                dfd.reject(err);
            }
            else {
                var totalCount = ret[0].u;
                var totalPage = Math.ceil(totalCount / pageSize);
                if(pageNo > totalPage){
                    pageNo = totalPage;
                }
                var offset = (pageNo - 1) * pageSize;
                if(offset < 0){
                    offset = 0;
                }
                console.log('totalCount:',totalCount,';totalPage:',totalPage,'offset:',offset);
                conn.query("select u.subscribe,u.openid,u.nickname,u.sex,u.language,u.city,u.province,u.country,u.headimgurl,FROM_UNIXTIME(u.subscribe_time,'%Y-%m-%d %H:%i:%S') subscribe_time,u.unionid,u.remark,u.groupid,u.flag from wx_user u limit ?,?", [offset, pageSize], function (err, rows) {
                    if(err){
                        dfd.reject(err);
                    }else{
                        //console.log(JSON.stringify({totalCount:totalCount, totalPage:totalPage, users:rows}));
                        dfd.resolve({totalCount:totalCount, totalPage:totalPage, users:rows});
                    }
                });
            }
            conn.release();
        })
    });
    return dfd.promise;
}

exports.addUserOpenid = function (openid) {
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        openid = "('" + openid + "')";
        //console.log(openid);
        conn.query('insert ignore into wx_user(openid) values '+openid, function (err, ret) {
            if (err) {
                console.error(err);
                dfd.reject(err);
            }
            else {
                dfd.resolve(ret);
            }
            conn.release();
        })
    })
    return dfd.promise;
};

exports.findOpenidByPage = function (pageNo, pageSize) {
    console.log('in findOpenidByPage...');
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        console.log('getConnection...');
        conn.query("select count(*) as u from wx_user where nickname is null", function (err, ret) {
            if (err) {
                dfd.reject(err);
            }
            else {
                var totalCount = ret[0].u;
                var totalPage = Math.ceil(totalCount / pageSize);
                if(pageNo > totalPage){
                    pageNo = totalPage;
                }
                var offset = (pageNo - 1) * pageSize;
                if(offset < 0){
                    offset = 0;
                }
                console.log('totalCount:',totalCount,';totalPage:',totalPage,'offset:',offset);
                conn.query("select u.openid from wx_user u where u.nickname is null and flag=0 limit ?,?", [offset, pageSize], function (err, rows) {
                    if(err){
                        dfd.reject(err);
                    }else{
                        dfd.resolve(rows);
                    }
                });
            }
            conn.release();
        })
    });
    return dfd.promise;
}

exports.updateUser = function (users) {
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        var _flag = users.flag;
        if(_flag === 0){
            conn.query('insert into wx_user (subscribe,openid,nickname,sex,language,city,province,country,headimgurl,subscribe_time,unionid,remark,groupid) values '+users.users + ' on duplicate key update subscribe=values(subscribe), openid=values(openid), nickname=values(nickname),sex=values(sex),language=values(language),city=values(city),province=values(province),country=values(country),headimgurl=values(headimgurl),subscribe_time=values(subscribe_time),unionid=values(unionid),remark=values(remark),groupid=values(groupid)', function (err, ret) {
                if (err) {
                    console.error(err);
                    dfd.resolve('mysql update error');
                }
                else {
                    dfd.resolve(ret);
                }
                conn.release();
            })
        }else{
            console.log(users);
            conn.query('insert into wx_user (subscribe, openid, unionid, flag) values '+users.users+' on duplicate key update subscribe=values(subscribe), openid=values(openid), unionid=values(unionid), flag=values(flag) ', function (err, ret) {
                if (err) {
                    console.error(err);
                    dfd.resolve('mysql update error');
                }
                else {
                    dfd.resolve(ret);
                }
                conn.release();
            })
        }
    })
    return dfd.promise;
};

exports.updateFlag = function (users) {
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        var _flag = users.flag;
        if(_flag == 2){
            conn.query('insert into wx_user (openid, flag) values ('+users.openid + ',' + users.flag + ') on duplicate key update openid=values(openid), flag=values(flag)', function (err, ret) {
                if (err) {
                    console.error(err);
                    dfd.resolve('mysql update error');
                }
                else {
                    dfd.resolve(ret);
                }
                conn.release();
            })
        }
    })
    return dfd.promise;
};

exports.updateGroupId = function (groupid, openid) {
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        conn.query('update wx_user set groupid=? where openid=? ', [groupid, openid], function (err, ret) {
            if (err) {
                console.error(err);
                dfd.resolve('mysql update error');
            }
            else {
                dfd.resolve(ret);
            }
            conn.release();
        })
    })
    return dfd.promise;
};

exports.batchUpdateGroupId = function (groupid, openids) {
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        conn.query('update wx_user set groupid=? where openid in (?) ', [groupid, openids], function (err, ret) {
            if (err) {
                console.error(err);
                dfd.resolve('mysql update error');
            }
            else {
                dfd.resolve(ret);
            }
            conn.release();
        })
    })
    return dfd.promise;
};

exports.findUsersByName = function (pageNo, pageSize, uname) {
    console.log('in findUsersByName...');
    var dfd = Q.defer();
    pool.getConnection(function (err, conn) {
        console.log('getConnection...');
        conn.query(" select count(*) as u from wx_user where nickname =? ", uname, function (err, ret) {
            if (err) {
                dfd.reject(err);
            }
            else {
                var totalCount = ret[0].u;
                var totalPage = Math.ceil(totalCount / pageSize);
                if(pageNo > totalPage){
                    pageNo = totalPage;
                }
                var offset = (pageNo - 1) * pageSize;
                if(offset < 0){
                    offset = 0;
                }
                console.log('totalCount:',totalCount,';totalPage:',totalPage,'offset:',offset);
                conn.query("select u.subscribe,u.openid,u.nickname,u.sex,u.language,u.city,u.province,u.country,u.headimgurl,FROM_UNIXTIME(u.subscribe_time,'%Y-%m-%d %H:%i:%S') subscribe_time,u.unionid,u.remark,u.groupid,u.flag from wx_user u where u.nickname=? limit ?,?", [uname, offset, pageSize], function (err, rows) {
                    if(err){
                        dfd.reject(err);
                    }else{
                        console.log(JSON.stringify({totalCount:totalCount, totalPage:totalPage, users:rows}));
                        dfd.resolve({totalCount:totalCount, totalPage:totalPage, users:rows});
                    }
                });
            }
            conn.release();
        })
    });
    return dfd.promise;
}

var express   =    require("express");
var mysql     =    require('mysql');

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host     : 'localhost',
    user     : 'yknx4',
    password : 'konami1994',
    database : 'information_retrieval',
    debug    :  false
});

function handle_database(req,res) {
    var query = req.params.query;
    pool.getConnection(function(err,connection){
        if (err) {
            connection.release();
            res.json({"code" : 100, "status" : "Error in connection database"});
            return;
        }   

        console.log('connected as id ' + connection.threadId);

        connection.query("select * from documents limit 100",function(err,rows){
            connection.release();
            if(!err) {
                res.json(rows);
            }           
        });

        connection.on('error', function(err) {      
            res.json({"code" : 100, "status" : "Error in connection database"});
            return;     
        });
    });
}

function get_documents(ids,page, result_callback){
    pool.getConnection(function(err,connection){
        if (err) {
            connection.release();
            result_callback(true,{"code" : 100, "status" : "Error in connection database"});
            return;
        }   
        //console.log(ids);
        var final_ids = [];
        var ind_start =((page-1)*20);
        for(var i = ind_start;i<ind_start+20;i++){
            if(i>=ids.length) break;
            final_ids.push(ids[i]);
        }
        console.log(final_ids);
        console.log('connected as id ' + connection.threadId);
        var query_w = "select * from documents where id in ("+final_ids.join(",")+") ";
        console.log(query_w);
        connection.query(query_w,function(err,rows){
        //connection.query("select * from documents limit 100",function(err,rows){
            connection.release();
            if(!err) {
                result_callback(false,rows);
                return;
            }           
        });

        connection.on('error', function(err) {      
            result_callback(true,{"code" : 100, "status" : "Error in connection database"}); 
            return;
        });
    });
}


module.exports.documents_route = handle_database;
module.exports.documents = get_documents;

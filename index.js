/*      Required Modules   */
var express = require('express');
var net = require('net');
var database = require("./model/database.js");

/*      End Required Modules        */

/*      Constants       */
var publicDir = process.argv[2] || __dirname + '/public';
var port = 3000;
var host = "localhost";
var search_port = 3002;

/*      End Constants       */

/*      Modules Instances       */
var app = express();

/*      End Module Instances        */

/*      Express Initialization       */
app.set('views', './views');
app.set('view engine', 'jade');
app.use(express.static(publicDir));

app.get('/', function (req, res) {
    res.render('home', {
        title: 'Welcome'
    });
});

var queryCache = {};
var gtFctn = function (req, res, next) {
    var page = 1;

    if (req.query.hasOwnProperty('page')) {
        console.log(req.query.page);
        page = req.query.page;
    }
    //console.log("First");
    var query = req.params.query;
    console.log(query);
    if (query === undefined) {
        query = req.query['query'];
    }
    console.log(query);
    var cacheItem = queryCache[query];
    console.log(cacheItem);
    if (typeof cacheItem !== 'undefined') {
        console.log('Previous entry exists');
        database.documents(cacheItem.ids, page, function (error, data) {
            if (!error) {
                var compare_fct = function (a, b) {
                    if (cacheItem.ids[a.id] < cacheItem.ids[b.id])
                        return 1;
                    if (cacheItem.ids[a.id] > cacheItem.ids[b.id])
                        return -1;
                    return 0;
                };
                console.log("base: " + req.baseUrl);
                console.log("original: " + req.originalUrl);
                data.sort(compare_fct);
                res.render('results', {
                    title: 'Results for: ' + query,
                    query: cacheItem.query,
                    items: data,
                    weights: cacheItem.weights,
                    count: cacheItem.ids.length,
                    page: page,
                    baseurl: req.baseUrl
                });
            } else {
                console.log('What the fuck' + error);
                res.render('home', {
                    title: 'Something wrong happened on getting documents'
                });
            }

        });
        
    } else {
        console.log('No cache found');
        var client = new net.Socket();
        client.setEncoding('utf8');
        client.connect(search_port, host, function () {
            console.log('Connected');
            client.write(query + '\r\n');
        });
        var fdata = "";
        client.on('data', function (data) {
            //console.log('Received: ' + data);
            fdata += data;
            //client.destroy(); // kill client after server's response
        });

        client.on('close', function (error) {
            console.log('Connection closed' + error);
            var realRes = JSON.parse(fdata);
            //console.log(realRes);

            var id_val_dic = {};
            var query_ids = [];
            for (var term in realRes) {
                var item = realRes[term];
                id_val_dic[item.Key] = item.Value;
                query_ids.push(item.Key);
                //console.log(query_ids[item.Key]);
                //console.log(id_val_dic[item.Key]);
            }
            database.documents(query_ids, page, function (error, data) {
                if (!error) {
                    var compare_fct = function (a, b) {
                        if (id_val_dic[a.id] < id_val_dic[b.id])
                            return 1;
                        if (id_val_dic[a.id] > id_val_dic[b.id])
                            return -1;
                        return 0;
                    };
                    console.log("base: " + req.baseUrl);
                    console.log("original: " + req.originalUrl);
                    data.sort(compare_fct);
                    var resultItem = {};
                    resultItem.query = query;
                    resultItem.items = data;
                    resultItem.weights = id_val_dic;
                    resultItem.ids = query_ids;
                    queryCache[query] = resultItem;

                    res.render('results', {
                        title: 'Results for: ' + query,
                        query: query,
                        items: data,
                        weights: id_val_dic,
                        count: query_ids.length,
                        page: page,
                        baseurl: req.baseUrl
                    });
                } else {
                    console.log('What the fuck' + error);
                    res.render('home', {
                        title: 'Something wrong happened on getting documents'
                    });
                }

            });

        });
        client.on('error', function (error) {
            console.log('What the fuck' + error);
            res.render('home', {
                title: 'Something wrong happened'
            });
        });

        //    
    }
};

app.get('/json/:query', function (req, res) {
    -
    database.documents_route(req, res);
});
app.get('/search', gtFctn);
//app.get('/search/:query', gtFctn);
/*      End Express Initialization      */

/*      Search Server Connection*/


/*      End Search Server Connection        */

/*      Index.js        */
console.log("Web server showing %s listening at http://%s:%s", publicDir, "localhost", port);
app.listen(port);


/*      End Index.js        */
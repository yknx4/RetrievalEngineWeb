var document = function(id, title, weight, url, date){
    this.id = id;
    this.title = title;
    this.weight = weight;
    this.url = url;
    this.date = date;
    return this;
}

module.exports.document = document;
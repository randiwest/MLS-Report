var $file = $('#input-file'),
    $run = $('#run'),
    $report = $('#report'),
    reportName =  $('#reportNameInput').val(),
    reportAddress =  $('#reportAddressInput').val(),
    $reportHeader = $('#reportHeader');


$run.click(function() {
    var file = $file[0].files[0];

    if (!file) {
        alert('Please select a file');
        return;
    }

    Papa.parse(file, {
        header: true,
        complete: function(result) {
            console.debug('CSV', result);
            generateReport(result.meta.fields, result.data);
        }
    });
});


function compileTemplate(tpl, vars) {
    return Handlebars.compile($('#' + tpl).html())(vars);
}

function generateReport(header, rows) {
    $report.empty();
 
    //
    // process rows, create data to pass to templates
    //
    var sold = {
        "rows": [],
        "totalListPrice": 0,
        "totalSalePrice": 0,
        "totalArea": 0,
        "averageListPrice": 0,
        "averageSalePrice": 0,
        "averageArea": 0,
        "averagePSF":0
    };
    var listings = {
        "rows": [],
        "totalListPrice": 0,
        "totalArea": 0,
        "averageListPrice": 0,
        "averageSalePrice": 0,
        "averageArea": 0,
        "averagePSF":0
    };

    rows.forEach(function(row) {
        [ 'List Price', 'Sold Price', 'Sold Price per SqFt', 'TotFlArea' ].forEach(function(column) {
            row[column] = Number(row[column].replace(/(^\$|,)/g, ''));
        });
    });

    rows.sort(function(a, b) {
        var aSaleDate = moment(a['Sold Date'], 'M/D/YYYY'),
            bSaleDate = moment(b['Sold Date'], 'M/D/YYYY');

        if (aSaleDate > bSaleDate) {
            return -1;
        } else if (aSaleDate < bSaleDate) {
            return 1;
        } else {
            if (a['Sold Price'] > b['Sold Price']) {
                return -1;
            } else if (a['Sold Price'] > b['Sold Price']) {
                return 1;
            } else {
                if (a['List Price'] > b['List Price']) {
                    return -1;
                } else if (a['List Price'] < b['List Price']) {
                    return 1;
                }
            }
        }
    });

    for( var row in rows) {
        var soldDate = rows[row]['Sold Date'];
        if (soldDate) {
            rows[row]['Sold Date'] = moment(soldDate, 'M/D/YYYY').format('MMM D, YYYY');
        }

        if(rows[row].Status == "S") {
            sold.rows.push(rows[row]);
            sold.totalListPrice = rows[row]["List Price"] + sold.totalListPrice;
            sold.totalSalePrice = rows[row]["Sold Price"] + sold.totalSalePrice;
            sold.totalArea = rows[row].TotFlArea + sold.totalArea;
            
        } else {
            listings.rows.push(rows[row]);
            listings.totalListPrice = rows[row]["List Price"] + listings.totalListPrice
            listings.totalArea = rows[row].TotFlArea + listings.totalArea;
            rows[row]["Sold Price per SqFt"] = rows[row]["List Price"] / rows[row]["TotFlArea"];
        }

        sold.averageListPrice = (sold.totalListPrice / sold.rows.length).formatMoney(0);
        sold.averageSalePrice = (sold.totalSalePrice / sold.rows.length).formatMoney(0);
        sold.averageArea = (sold.totalArea / sold.rows.length).formatMoney(0);
        sold.averagePSF = (sold.totalSalePrice / sold.totalArea).formatMoney(0);

        listings.averageListPrice = (listings.totalListPrice / listings.rows.length).formatMoney(0);
        listings.averageArea = (listings.totalArea / listings.rows.length).formatMoney(0);
        listings.averagePSF = (listings.totalListPrice / listings.totalArea).formatMoney(0);

        [ 'List Price', 'Sold Price', 'Sold Price per SqFt' ].forEach(function(column) {
            rows[row][column] = rows[row][column].formatMoney(0);
        });

    }

    console.log(listings.rows);

    //
    // compile templates and append to report
    //
    $report.append(compileTemplate('salesHeading', { title: 'SALES' }));
    $report.append(compileTemplate('salesDump', { header: header, rows: sold.rows, totalListPrice: sold.totalListPrice.formatMoney(0) , totalSalePrice: sold.totalSalePrice.formatMoney(0), totalArea: sold.totalArea.formatMoney(0), averageListPrice: sold.averageListPrice, averageSalePrice: sold.averageSalePrice, averageArea: sold.averageArea, averagePSF: sold.averagePSF}));

    $report.append(compileTemplate('listingsHeading', { title: 'LISTINGS' }));
    $report.append(compileTemplate('listingsDump', { header: header, rows: listings.rows, totalListPrice: listings.totalListPrice.formatMoney(0) , totalArea: listings.totalArea.formatMoney(0), averageListPrice: listings.averageListPrice, averageArea: listings.averageArea, averagePSF: listings.averagePSF }));
    $reportHeader.append(compileTemplate('reportHeader',{reportName: reportName, reportAddress: reportAddress}));
}

Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

 





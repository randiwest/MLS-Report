var $file = $('#input-file'),
    $run = $('#run'),
    $report = $('#report');


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
    rows.pop();

    $report.empty();
 
    var reportName =  $('#reportNameInput').val(),
        reportAddress =  $('#reportAddressInput').val(),
        reportDateRange = $('#reportDateRangeInput').val(),
        $reportHeader = $('#reportHeader');

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
        "averagePSF":0,
        "count":0
    };
    var listings = {
        "rows": [],
        "totalListPrice": 0,
        "totalArea": 0,
        "averageListPrice": 0,
        "averageSalePrice": 0,
        "averageArea": 0,
        "averagePSF":0,
        "count":0
    };
    var summary = {}, 
        summarytots = { 
            total: {
                price: 0,
                num_sold: 0,
                area: 0
            }
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

    for (var row in rows) {
        var soldDate = rows[row]['Sold Date'];
        if (soldDate) {
            soldDate = moment(soldDate, 'M/D/YYYY');
            rows[row]['Sold Date'] = soldDate.format('MMM D, YYYY');
        }

        if (rows[row].Status == "S") {
            sold.rows.push(rows[row]);
            sold.totalListPrice = rows[row]["List Price"] + sold.totalListPrice;
            sold.totalSalePrice = rows[row]["Sold Price"] + sold.totalSalePrice;
            sold.totalArea = rows[row].TotFlArea + sold.totalArea;
            
            var ssd = soldDate.format('MMM - YY'),
                s = summary[ssd];

            if (!s) {
                s = summary[ssd] = {
                    total: {
                        price: 0,
                        area: 0,
                        num_sold: 0
                    }
                };
            }

            var br = rows[row]['Tot BR'],
                b = s[br];

            if (!b) {
                b = s[br] = {
                    price: 0,
                    area: 0,
                    num_sold: 0
                };
            }

            ++b.num_sold;
            b.price += rows[row]['Sold Price'];
            b.area += rows[row]['TotFlArea'];

            ++s.total.num_sold;
            s.total.price += rows[row]['Sold Price'];
            s.total.area += rows[row]['TotFlArea'];

            var br = rows[row]['Tot BR'],
                brt = summarytots[br];

            if (!brt) {
                brt = summarytots[br] = {
                    price: 0,
                    area: 0,
                    num_sold: 0
                };
            }

            ++brt.num_sold;
            brt.price += rows[row]['Sold Price'];
            brt.area += rows[row]['TotFlArea'];

            ++summarytots.total.num_sold;
            summarytots.total.price += rows[row]['Sold Price'];
            summarytots.total.area += rows[row]['TotFlArea'];
        } else {
            listings.rows.push(rows[row]);
            listings.totalListPrice = rows[row]["List Price"] + listings.totalListPrice;
            listings.totalArea = rows[row].TotFlArea + listings.totalArea;
            rows[row]["Sold Price per SqFt"] = rows[row]["List Price"] / rows[row].TotFlArea;
        }

        sold.averageListPrice = (sold.totalListPrice / sold.rows.length).formatMoney(0);
        sold.averageSalePrice = (sold.totalSalePrice / sold.rows.length).formatMoney(0);
        sold.averageArea = (sold.totalArea / sold.rows.length).formatMoney(0);
        sold.averagePSF = (sold.totalSalePrice / sold.totalArea).formatMoney(0);
        sold.count = sold.rows.length;

        listings.averageListPrice = (listings.totalListPrice / listings.rows.length).formatMoney(0);
        listings.averageArea = (listings.totalArea / listings.rows.length).formatMoney(0);
        listings.averagePSF = (listings.totalListPrice / listings.totalArea).formatMoney(0);
        listings.count = listings.rows.length;

        [ 'List Price', 'Sold Price', 'Sold Price per SqFt' ].forEach(function(column) {
            rows[row][column] = rows[row][column].formatMoney(0);
        });
    }

    for (var month in summary) {
        for (var nbr in summary[month]) {
            var br = summary[month][nbr];
            br.psf = (br.price / br.area).formatMoney(0);
        }
    }

    for (var nbr in summarytots) {
        var br = summarytots[nbr];
        br.psf = (br.price / br.area).formatMoney(0);
    }

    console.log(listings.rows, summarytots);

    //
    // compile templates and append to report
    //
    $report.append(compileTemplate('reportHeading',{ 
        reportName: reportName, reportAddress: reportAddress, reportDateRange: reportDateRange}));

    $report.append(compileTemplate('salesHeading', { title: 'SALES', count: sold.count }));
    $report.append(compileTemplate('salesDump', { 
        header: header, rows: sold.rows, totalListPrice: sold.totalListPrice.formatMoney(0), 
        totalSalePrice: sold.totalSalePrice.formatMoney(0), totalArea: sold.totalArea.formatMoney(0), 
        averageListPrice: sold.averageListPrice, averageSalePrice: sold.averageSalePrice, 
        averageArea: sold.averageArea, averagePSF: sold.averagePSF
    }));

    $report.append(compileTemplate('listingsHeading', { title: 'LISTINGS' , count: listings.count}));
    $report.append(compileTemplate('listingsDump', {
        header: header, rows: listings.rows, totalListPrice: listings.totalListPrice.formatMoney(0), 
        totalArea: listings.totalArea.formatMoney(0), averageListPrice: listings.averageListPrice, 
        averageArea: listings.averageArea, averagePSF: listings.averagePSF 
    }));

    $report.append(compileTemplate('summary', { summary: summary, summarytots: summarytots }));
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

 





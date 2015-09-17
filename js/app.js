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
    })
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
        "totalArea": 0
   }
    var listings = {
        "rows": [],
        "totalListPrice": 0,
        "totalArea": 0
   }

    console.log(rows);
   for( var row in rows) {
        if(rows[row].Status == "S") {
            sold.rows.push(rows[row])
            sold.totalListPrice = Number(rows[row]["List Price"].replace("$","").replace(",","")) + sold.totalListPrice
            sold.totalSalePrice = Number(rows[row]["Sold Price"].replace("$","").replace(",","")) + sold.totalSalePrice
            sold.totalArea = Number(rows[row]["TotFlArea"]) + sold.totalArea
        } else {
            listings.rows.push(rows[row])
           // listings.totalListPrice = Number(rows[row]["List Price"].replace("$","").replace(",","")) + listings.totalListPrice
            listings.totalArea = Number(rows[row]["TotFlArea"]) + listings.totalArea
        }
    }

    console.log(listings.rows);

    //
    // compile templates and append to report
    //
    $report.append(compileTemplate('heading', { title: 'SALES' }));
    $report.append(compileTemplate('dump', { header: header, rows: sold.rows}));

    $report.append(compileTemplate('heading', { title: 'LISTINGS' }));
    $report.append(compileTemplate('dump', { header: header, rows: listings.rows }));
}

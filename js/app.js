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
    var header, rows;
    var rows = [];
    rows.push(rows);


    //
    // compile templates and append to report
    //
    $report.append(compileTemplate('heading', { title: 'Some Title' }));
    $report.append(compileTemplate('dump', { header: header, rows: rows }));
}

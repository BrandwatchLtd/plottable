
function makeData() {
  "use strict";

  return makeRandomData(50);
}

function run(div, data, Plottable) {
  "use strict";

  var svg = div.append("svg").attr("height", 500);
  var ds = new Plottable.Dataset(data);

  var xScale = new Plottable.Scale.Linear();
  var yScale = new Plottable.Scale.Linear();
  var xAxis = new Plottable.Axis.Numeric(xScale, "bottom");
  var yAxis = new Plottable.Axis.Numeric(yScale, "left");
  var linePlot = new Plottable.Plot.Line(xScale, yScale).automaticallyAdjustYScaleOverVisiblePoints(true).addDataset(ds);
  
  var focusXLabel = new Plottable.Component.Label("focus X");

  var basicTable = new Plottable.Component.Table([
    [yAxis, linePlot],
    [focusXLabel, xAxis]
    ]);

  basicTable.renderTo(svg);

  function xFocus(){
    xScale.domain([0.25, 0.5]);
  }

  focusXLabel.registerInteraction(
    new Plottable.Interaction.Click().callback(xFocus)
  );
}

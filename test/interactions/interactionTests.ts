///<reference path="../testReference.ts" />

var assert = chai.assert;


function makeFakeEvent(x: number, y: number): D3.D3Event {
  return <D3.D3Event> <any> {
      dx: 0,
      dy: 0,
      clientX: x,
      clientY: y,
      translate: [x, y],
      scale: 1,
      sourceEvent: <any> null,
      x: x,
      y: y,
      keyCode: 0,
      altKey: false
    };
}

function fakeDragSequence(anyedInteraction: any, startX: number, startY: number, endX: number, endY: number) {
  anyedInteraction._dragstart();
  d3.event = makeFakeEvent(startX, startY);
  anyedInteraction._drag();
  d3.event = makeFakeEvent(endX, endY);
  anyedInteraction._drag();
  anyedInteraction._dragend();
  d3.event = null;
}

describe("Interactions", () => {
  describe("PanZoomInteraction", () => {
    it("Pans properly", () => {
      // The only difference between pan and zoom is internal to d3
      // Simulating zoom events is painful, so panning will suffice here
      var xScale = new Plottable.Scale.Linear().domain([0, 11]);
      var yScale = new Plottable.Scale.Linear().domain([11, 0]);

      var svg = generateSVG();
      var dataset = makeLinearSeries(11);
      var plot = new Plottable.Plot.Scatter(xScale, yScale).addDataset(dataset);
      plot.renderTo(svg);

      var xDomainBefore = xScale.domain();
      var yDomainBefore = yScale.domain();

      var interaction = new Plottable.Interaction.PanZoom(xScale, yScale);
      plot.registerInteraction(interaction);

      var hb = plot._element.select(".hit-box").node();
      var dragDistancePixelX = 10;
      var dragDistancePixelY = 20;
      $(hb).simulate("drag", {
        dx: dragDistancePixelX,
        dy: dragDistancePixelY
      });

      var xDomainAfter = xScale.domain();
      var yDomainAfter = yScale.domain();

      assert.notDeepEqual(xDomainAfter, xDomainBefore, "x domain was changed by panning");
      assert.notDeepEqual(yDomainAfter, yDomainBefore, "y domain was changed by panning");

      function getSlope(scale: Plottable.Scale.Linear) {
        var range = scale.range();
        var domain = scale.domain();
        return (domain[1]-domain[0])/(range[1]-range[0]);
      };

      var expectedXDragChange = -dragDistancePixelX * getSlope(xScale);
      var expectedYDragChange = -dragDistancePixelY * getSlope(yScale);

      assert.closeTo(xDomainAfter[0]-xDomainBefore[0], expectedXDragChange, 1, "x domain changed by the correct amount");
      assert.closeTo(yDomainAfter[0]-yDomainBefore[0], expectedYDragChange, 1, "y domain changed by the correct amount");

      svg.remove();
    });
  });

  describe("XYDragBoxInteraction", () => {
    var svgWidth = 400;
    var svgHeight = 400;
    var svg: D3.Selection;
    var dataset: Plottable.Dataset;
    var xScale: Plottable.Scale.AbstractQuantitative<number>;
    var yScale: Plottable.Scale.AbstractQuantitative<number>;
    var plot: Plottable.Plot.AbstractXYPlot<number,number>;
    var interaction: Plottable.Interaction.XYDragBox;

    var dragstartX = 20;
    var dragstartY = svgHeight-100;
    var dragendX = 100;
    var dragendY = svgHeight-20;

    before(() => {
      svg = generateSVG(svgWidth, svgHeight);
      dataset = new Plottable.Dataset(makeLinearSeries(10));
      xScale = new Plottable.Scale.Linear();
      yScale = new Plottable.Scale.Linear();
      plot = new Plottable.Plot.Scatter(xScale, yScale);
      plot.addDataset(dataset);
      plot.renderTo(svg);
      interaction = new Plottable.Interaction.XYDragBox();
      plot.registerInteraction(interaction);
    });

    afterEach(() => {
      interaction.dragstart(null);
      interaction.drag(null);
      interaction.dragend(null);
      interaction.clearBox();
    });

    it("All callbacks are notified with appropriate data on drag", () => {
      var timesCalled = 0;
      interaction.dragstart(function(a: Plottable.Point) {
        timesCalled++;
        var expectedStartLocation = {x: dragstartX, y: dragstartY};
        assert.deepEqual(a, expectedStartLocation, "areaCallback called with null arg on dragstart");
      });
      interaction.dragend(function(a: Plottable.Point, b: Plottable.Point) {
        timesCalled++;
        var expectedStart = {
          x: dragstartX,
          y: dragstartY
        };
        var expectedEnd = {
          x: dragendX,
          y: dragendY
        };
        assert.deepEqual(a, expectedStart, "areaCallback was passed the correct starting point");
        assert.deepEqual(b, expectedEnd, "areaCallback was passed the correct ending point");
      });

      // fake a drag event
      fakeDragSequence((<any> interaction), dragstartX, dragstartY, dragendX, dragendY);

      assert.equal(timesCalled, 2, "drag callbacks are called twice");
    });

    it("Highlights and un-highlights areas appropriately", () => {
      fakeDragSequence((<any> interaction), dragstartX, dragstartY, dragendX, dragendY);
      var dragBoxClass = "." + (<any> Plottable.Interaction.XYDragBox).CLASS_DRAG_BOX;
      var dragBox = plot._backgroundContainer.select(dragBoxClass);
      assert.isNotNull(dragBox, "the dragbox was created");
      var actualStartPosition = {x: parseFloat(dragBox.attr("x")), y: parseFloat(dragBox.attr("y"))};
      var expectedStartPosition = {x: Math.min(dragstartX, dragendX), y: Math.min(dragstartY, dragendY)};
      assert.deepEqual(actualStartPosition, expectedStartPosition, "highlighted box is positioned correctly");
      assert.equal(parseFloat(dragBox.attr("width")), Math.abs(dragstartX-dragendX), "highlighted box has correct width");
      assert.equal(parseFloat(dragBox.attr("height")), Math.abs(dragstartY-dragendY), "highlighted box has correct height");

      interaction.clearBox();
      var boxGone = dragBox.attr("width") === "0" && dragBox.attr("height") === "0";
      assert.isTrue(boxGone, "highlighted box disappears when clearBox is called");
    });

    after(() => {
      svg.remove();
    });
  });

  describe("YDragBoxInteraction", () => {
    var svgWidth = 400;
    var svgHeight = 400;
    var svg: D3.Selection;
    var dataset: Plottable.Dataset;
    var xScale: Plottable.Scale.AbstractQuantitative<number>;
    var yScale: Plottable.Scale.AbstractQuantitative<number>;
    var plot: Plottable.Plot.AbstractXYPlot<number,number>;
    var interaction: Plottable.Interaction.XYDragBox;

    var dragstartX = 20;
    var dragstartY = svgHeight-100;
    var dragendX = 100;
    var dragendY = svgHeight-20;

    before(() => {
      svg = generateSVG(svgWidth, svgHeight);
      dataset = new Plottable.Dataset(makeLinearSeries(10));
      xScale = new Plottable.Scale.Linear();
      yScale = new Plottable.Scale.Linear();
      plot = new Plottable.Plot.Scatter(xScale, yScale);
      plot.addDataset(dataset);
      plot.renderTo(svg);
      interaction = new Plottable.Interaction.YDragBox();
      plot.registerInteraction(interaction);
    });

    afterEach(() => {
      interaction.dragstart(null);
      interaction.drag(null);
      interaction.dragend(null);
      interaction.clearBox();
    });

    it("All callbacks are notified with appropriate data when a drag finishes", () => {
      var timesCalled = 0;
      interaction.dragstart(function(a: Plottable.Point) {
        timesCalled++;
        var expectedY = dragstartY;
        assert.deepEqual(a.y, expectedY, "areaCallback called with null arg on dragstart");
      });
      interaction.dragend(function(a: Plottable.Point, b: Plottable.Point) {
        timesCalled++;
        var expectedStartY = dragstartY;
        var expectedEndY = dragendY;
        assert.deepEqual(a.y, expectedStartY);
        assert.deepEqual(b.y, expectedEndY);
      });

      // fake a drag event
      fakeDragSequence((<any> interaction), dragstartX, dragstartY, dragendX, dragendY);

      assert.equal(timesCalled, 2, "drag callbacks area called twice");
    });

    it("Highlights and un-highlights areas appropriately", () => {
      fakeDragSequence((<any> interaction), dragstartX, dragstartY, dragendX, dragendY);
      var dragBoxClass = "." + (<any> Plottable.Interaction.XYDragBox).CLASS_DRAG_BOX;
      var dragBox = plot._backgroundContainer.select(dragBoxClass);
      assert.isNotNull(dragBox, "the dragbox was created");
      var actualStartPosition = {x: parseFloat(dragBox.attr("x")), y: parseFloat(dragBox.attr("y"))};
      var expectedStartPosition = {x: 0, y: Math.min(dragstartY, dragendY)};
      assert.deepEqual(actualStartPosition, expectedStartPosition, "highlighted box is positioned correctly");
      assert.equal(parseFloat(dragBox.attr("width")), svgWidth, "highlighted box has correct width");
      assert.equal(parseFloat(dragBox.attr("height")), Math.abs(dragstartY-dragendY), "highlighted box has correct height");

      interaction.clearBox();
      var boxGone = dragBox.attr("width") === "0" && dragBox.attr("height") === "0";
      assert.isTrue(boxGone, "highlighted box disappears when clearBox is called");
    });

    after(() => {
      svg.remove();
    });
  });

  describe("KeyInteraction", () => {
    it("Triggers appropriate callback for the key pressed", () => {
      var svg = generateSVG(400, 400);
      var component = new Plottable.Component.AbstractComponent();
      component.renderTo(svg);

      var ki = new Plottable.Interaction.Key();

      var aCode = 65; // "a" key
      var bCode = 66; // "b" key

      var aCallbackCalled = false;
      var aCallback = () => aCallbackCalled = true;
      var bCallbackCalled = false;
      var bCallback = () => bCallbackCalled = true;

      ki.on(aCode, aCallback);
      ki.on(bCode, bCallback);
      component.registerInteraction(ki);

      var $hitbox = $((<any> component).hitBox.node());

      $hitbox.simulate("mouseover");
      $hitbox.simulate("keydown", { keyCode: aCode });
      assert.isTrue(aCallbackCalled, "callback for \"a\" was called when \"a\" key was pressed");
      assert.isFalse(bCallbackCalled, "callback for \"b\" was not called when \"a\" key was pressed");

      aCallbackCalled = false;
      $hitbox.simulate("keydown", { keyCode: bCode });
      assert.isFalse(aCallbackCalled, "callback for \"a\" was not called when \"b\" key was pressed");
      assert.isTrue(bCallbackCalled, "callback for \"b\" was called when \"b\" key was pressed");
      svg.remove();
    });
  });
});

///<reference path="../lib/d3.d.ts" />
///<reference path="../lib/chai/chai.d.ts" />
///<reference path="renderable.ts" />

class Axis extends Renderable {
  public static yWidth = 50;
  public static xHeight = 30;
  public element: D3.Selection;
  public d3axis: D3.Svg.Axis;
  private cachedScale: number;
  private cachedTranslate: number;
  private isXAligned: boolean;

  private static axisXTransform(selection, x) {
    selection.attr("transform", function(d) {
      return "translate(" + x(d) + ",0)";
    });
  }

  private static axisYTransform(selection, y) {
    selection.attr("transform", function(d) {
      return "translate(0," + y(d) + ")";
    });
  }

  constructor(
    public scale: D3.Scale.Scale,
    public orientation: string,
    public formatter: any
  ) {
    super();
    this.isXAligned = this.orientation === "bottom" || this.orientation === "top";
    this.d3axis = d3.svg.axis().scale(this.scale).orient(this.orientation);
    if (this.formatter == null) {
      this.formatter = d3.format("s3");
    }
    this.d3axis.tickFormat(this.formatter);
    this.cachedScale = 1;
    this.cachedTranslate = 0;
  }

  private transformString(translate: number, scale: number) {
    var translateS = this.isXAligned ? "" + translate : "0," + translate;
    return "translate(" + translateS + ")";
  }

  public rowWeight(): number;
  public rowWeight(newVal: number): Renderable;
  public rowWeight(newVal?: number): any {
    if (newVal != null) {
      throw new Error("Axis row weight is not settable.");
      return this;
    } else {
      return 0;
    }
  }

  public colWeight(): number;
  public colWeight(newVal: number): Renderable;
  public colWeight(newVal?: number): any {
    if (newVal != null) {
      throw new Error("Axis col weight is not settable.");
      return this;
    } else {
      return 0;
    }
  }

  public render(element: D3.Selection, width: number, height: number) {
    this.element = element.append("g").classed("axis", true);
    this.element.append("rect").attr("width", width).attr("height", height).classed("axis-box", true);
    if (this.orientation === "left") this.element.attr("transform", "translate(" + Axis.yWidth + ")");
    if (this.orientation === "top")  this.element.attr("transform", "translate(0," + Axis.xHeight + ")");
    var domain = this.scale.domain();
    var extent = Math.abs(domain[1] - domain[0]);
    var min = +d3.min(domain);
    var max = +d3.max(domain);
    var newDomain: any;
    var standardOrder = domain[0] < domain[1];
    if (typeof(domain[0]) == "number") {
      newDomain = standardOrder ? [min - extent, max + extent] : [max + extent, min - extent];
    } else {
      newDomain = standardOrder ? [new Date(min - extent), new Date(max + extent)] : [new Date(max + extent), new Date(min - extent)];
    }
    // var copyScale = this.scale.copy().domain(newDomain)
    // var ticks = (<any> copyScale).ticks(30);
    // this.d3axis.tickValues(ticks);
    // a = [100,0]; extent = -100; 100 - (-100) = 200, 0 - (-100) = 100
    // a = [0,100]; extent = 100; 0 - 100 = -100, 100 - 100
    this.element.call(this.d3axis);
    var bbox = (<any> this.element.node()).getBBox();
    if (bbox.height > height || bbox.width > width) {
      this.element.classed("error", true);
    }
    // chai.assert.operator(this.element.node().getBBox().height, '<=', height, "axis height is appropriate");
    // chai.assert.operator(this.element.node().getBBox().width,  '<=', width, "axis width is appropriate");
  }

  public rescale() {
    var tickTransform = this.isXAligned ? Axis.axisXTransform : Axis.axisYTransform;
    var tickSelection = this.element.selectAll(".tick");
    (<any> tickSelection).call(tickTransform, this.scale);
    this.element.attr("transform","");
  }

  public transform(translatePair: number[], scale: number) {
    var translate = this.isXAligned ? translatePair[0] : translatePair[1];
    if (scale != null && scale != this.cachedScale) {
      this.cachedTranslate = translate;
      this.cachedScale = scale;
      this.rescale();
    } else {
      translate -= this.cachedTranslate;
      var transform = this.transformString(translate, scale);
      this.element.attr("transform", transform);
    }
  }
}

class XAxis extends Axis {
  constructor(scale: D3.Scale.Scale, orientation: string, formatter: any = null) {
    super(scale, orientation, formatter);
    super.rowMinimum(Axis.xHeight);
  }
}

class YAxis extends Axis {
  constructor(scale: D3.Scale.Scale, orientation: string, formatter: any = null) {
    super(scale, orientation, formatter);
    super.colMinimum(Axis.yWidth);
  }
}
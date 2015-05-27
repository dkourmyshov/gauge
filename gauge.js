function SVGElement(properties) {
  properties = properties || {};
  var element = document.createElementNS(this.NS, 'svg');
  element.style.width = properties.width || '400px';
  element.style.height = properties.height || '400px';
  var appendTo = properties.appendTo || document.getElementsByTagName("body")[0];
  appendTo.appendChild(element);
  this.element = element;
}
SVGElement.prototype = {
  NS: 'http://www.w3.org/2000/svg',
  appendShape: function (shape, properties) {
    properties = properties || {};
    var element = document.createElementNS(this.NS, shape);
    for (var property in properties) if (properties.hasOwnProperty(property)) {
      element.setAttribute(property, properties[property]);
    }
    this.element.appendChild(element);
    return element;
  },
};

function Gauge(properties) {
  properties = properties || {};
  this.height = properties.height || 400;
  this.width = properties.width || 600;
  this.start = properties.start || 0;
  this.end = properties.end || 1;
  this.center = [this.width / 2,
    typeof properties.vOffset === 'undefined' ? this.height / 2 :
      this.height - properties.vOffset];
  this.aperture = (properties.aperture || 210) * Math.PI / 180;
  this.radius = properties.radius || this.width * 0.3;
  this.appendTo = properties.appendTo || document.getElementsByTagName("body")[0];
  this.segments = properties.segments || [{start: this.start, end: this.end}];
  this.markers = properties.markers || [this.start, this.end];
  this.scaleStyle = properties.scaleStyle || 'outside';

  this.render();

  this.setValue(this.start);
}
Gauge.prototype = {
  // public
  setValue: function (value) {
    this.needle.setAttribute('transform', 'rotate(' + this.rescale(value) / Math.PI * 180 + ' ' + this.center.join(' ') +')');
  },
  // private
  polarToRectangular: function(center, r, a) {
    return [
      Math.round(center[0] + r * Math.cos(a)),
      Math.round(center[1] + r * Math.sin(a))
    ];
  },
  appendArc: function (properties) {
    var start = this.polarToRectangular(properties.center, properties.r, properties.start);
    var end = this.polarToRectangular(properties.center, properties.r, properties.end);
    var largeArcFlag = properties.end - properties.start > Math.PI ? '1' : '0'; 
    var path = 'M' + start.join(',') +
         ' A' + properties.r + ',' + properties.r +
         ' 0 ' + largeArcFlag + ',1 ' + 
         end.join(',');
    this.svgElement.appendShape('path', {
      d: path,
      class: properties.class
    });
  },
  /* converts value on gauge scale to angle in radians (measured clockwise from (1, 0)) */
  rescale: function (number) {
    return ((number - this.start) / (this.end - this.start) - 0.5) * this.aperture + Math.PI * 1.5;
  },
  render: function () {
    var i;
    this.svgElement = new SVGElement({
      appendTo: this.appendTo,
      width: '' + this.width + 'px',
      height: '' + this.height + 'px'
    });

    for (i = 0; i < this.segments.length; i++) {
      this.appendArc({
        center: this.center,
        start: this.rescale(this.segments[i].start),
        end: this.rescale(this.segments[i].end),
        r: this.radius,
        class: 'gauge ' + this.segments[i].style || ''
      });
    }

    for (i = 0; i < this.markers.length; i++) {
      var value, label, tick;
      if (typeof this.markers[i] === 'number') {
        value = label = this.markers[i];
        tick = true;
      } else {
        value = this.markers[i].value;
        label = this.markers[i].label;
        tick = this.markers[i].tick;
      }
      var a = this.rescale(value);
      var side = this.scaleStyle === 'inside' ? -1 : 1;
      if (tick) {
        var start = this.polarToRectangular(this.center, this.radius * (1 + 0.025 * side), a);
        var end = this.polarToRectangular(this.center, this.radius * (1 + 0.05 * side), a);
        this.svgElement.appendShape('path', {
          d: 'M' + start.join(',') + ' L' + end.join(','),
          class: 'marker'
        });
      }
      var textPos = this.polarToRectangular(this.center, this.radius * (1 + 0.075 * side), a);
      var alignment = a < Math.PI * 1.4 ? 0 : 
                      a < Math.PI * 1.6 ? 1 :
                                          2;
      if (this.scaleStyle === 'inside') {
        alignment = 2 - alignment;
      }
      alignment = [
        'text-anchor: end;',
        'text-anchor: middle;',
        'text-anchor: start;'
      ][alignment];
      this.svgElement.appendShape('text', {
        x: textPos[0],
        y: textPos[1],
        class: 'label',
        style: alignment + (this.scaleStyle === 'inside' ? ' dominant-baseline: hanging;' : '')
      }).innerHTML = label;
    }

    this.needle = this.svgElement.appendShape('polygon', {
      class: "needle",
      points: "" + (this.center[0]) + " " +
                   (this.center[1] - this.radius * 0.025) + " " +
                   (this.center[0]) + " " +
                   (this.center[1] + this.radius * 0.025) + " " +
                   (this.center[0] + this.radius * 1.05) + " " +
                   (this.center[1])
    });
    this.svgElement.appendShape('circle', {
      cx: this.center[0],
      cy: this.center[1],
      r: this.radius * 0.05,
      class: "needle"
    });
  }
};

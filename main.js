
var bar_height = 25;
var rad = 12.5;

w = window.innerWidth
h = window.innerHeight

var num =0

//to calculate programmatically
//usually these sorts of defaults would be dangerous, but I do know SOME things about the data, so risk is small
var min_year=9999
var max_year=0
var top_padding = 7
var bottom_padding = 50
var left_margin= 250
var right_margin = 100
var top_margin = 50

var shift = 0

//maybe eventually fix the json
//for now, just rearrange things here
function init() {
  $.getJSON("breakdown.json", function(data){
    var cat_data = Object.keys(data).map(function(k, i){
      let ret = {}
      ret.group = k[0].toUpperCase() + k.substring(1)
      ret.id = k.replaceAll(",", '').replaceAll(" ", "-")
      ret.index=i
      ret.collapsed = false
      ret.cats = Object.keys(data[k]).map(function(ke){
        for(let j=0;j<data[k][ke].length; j++) {
          if (data[k][ke][j].start<min_year){min_year=data[k][ke][j].start;}
          else if (data[k][ke][j].end>max_year){max_year=data[k][ke][j].end;}
        }
        return {
          name:ke[0].toUpperCase() + ke.substring(1),
          label:ke.replaceAll(",", '').replaceAll(" ", "-"),
          ranges:data[k][ke].sort((a, b) => (a.start > b.start) ? 1 : -1)
        }
      }).sort((a, b) => (a.ranges[0].start > b.ranges[0].start) ? 1 : -1);
      num+= ret.cats.length
      return ret;
    });

    //for safety's sake, just do everything here
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    var scale = d3.scaleLinear().domain([min_year-5, max_year]).range([left_margin, w-right_margin])

    var x_axis = d3.axisBottom().scale(scale).tickFormat(d3.format("d"));


    var getY = function(group, index) {
      let total =0;
      for(let i=0;i<group;i++) {
        total += (bar_height+top_padding)*(cat_data[i].collapsed? 1: cat_data[i].cats.length);
      }
      total += (bar_height+top_padding)*(cat_data[group].collapsed? 0: index);
      return total + top_margin ;
    }

    var svg = d3.select("#timeline")
    .append("svg")
    .attr("width", w)
    .attr("height", num*bar_height + num*top_padding + bottom_padding + top_margin)

    var cats = svg.selectAll("g")
    .data(cat_data)
    .enter().append("g")
    .attr("class", "expense-group")
    .attr("id", function(d) {return "group" + d.index.toString()})
    .attr("index", function(d){return d.index})

    for(let i=0;i<cat_data.length;i++) {
      for(let j=0;j<cat_data[i].cats.length;j++) {
        var ranges = d3.selectAll("#group" + i.toString())
        .append("g")
        .attr("class", "expense")
        .attr("id", cat_data[i].cats[j].label)
        .attr("index", j)
        .attr("group", i)
        .selectAll("rect")
        .data(cat_data[i].cats[j].ranges)
        .enter().append("rect")
        .attr("fill", colorScale(i))
        .attr("x", function(d){
          return scale(d.start)
        })
        .attr("y", function(d){
          return getY(i, j)
        })
        .attr("width", function(d){
          return scale(d.end)-scale(d.start)
        })
        .attr("height", bar_height)
        .attr("fill", colorScale(i))
        .attr("fill-opacity", 0.4)
        .attr("stroke", colorScale(i))
        .append("title")
        .text(function(d){
          return `${cat_data[i].cats[j].name} (${d.start}-${d.end})`
        })


      }

    }


    var anchors = d3.selectAll(".expense")
    .append("circle")
    .attr("cx", function(){
      return scale(min_year-3)
    })
    .attr("cy", function(){
      return getY(d3.select(this.parentNode).attr("group"), d3.select(this.parentNode).attr("index")) + rad
    })
    .attr("r", rad)
    .attr("fill", function(){
      return colorScale(d3.select(this.parentNode).attr("group"))
    })
    .append("title")
    .text(function(){
      return cat_data[d3.select(this.parentNode.parentNode).attr("group")].cats[d3.select(this.parentNode.parentNode).attr("index")].name
    })



    var lines = d3.selectAll(".expense")
    .append("line")
   .style("stroke", "grey")
   .style("stroke-width", 0.5)
   .style("opacity", 0,8)
   .attr("x1", scale(min_year-3)+rad)
   .attr("x2", w-right_margin)
   .attr("y1",  function(){
     return getY(d3.select(this.parentNode).attr("group"), d3.select(this.parentNode).attr("index")) + rad
    })
    .attr("y2",  function(){
      return getY(d3.select(this.parentNode).attr("group"), d3.select(this.parentNode).attr("index")) + rad
     })
   .style("z-index", -1)

   var redraw= function(ind) {
     for(let i=0;i<cat_data.length;i++) {
       sel = "#group" + i
       d3.select("#group" + i)
       .selectAll(".expense")
       .selectAll("rect")
       .transition()
       .duration(500)
       .attr("y", function(){
         return getY(i, parseInt(d3.select(this.parentNode).attr('index')))
       })



       d3.select("#group" + i)
       .selectAll(".expense")
       .selectAll("circle")
       .transition()
       .duration(500)
        .attr("cy", function(){
          return getY(i, parseInt(d3.select(this.parentNode).attr('index')))+rad
        })


       d3.select("#group" + i)
        .selectAll(".expense")
        .selectAll("line")
        .transition()
        .duration(500)
        .attr("y1", function(){
          return getY(i, parseInt(d3.select(this.parentNode).attr('index')))+rad
        })
        .attr("y2", function() {
          return getY(i, parseInt(d3.select(this.parentNode).attr('index')))+rad
        })

        d3.select("#group" + i)
         .select(".cat-label")
         .transition()
         .duration(500) 
         .attr("y", function() {
           return getY(i,0)+rad
         })



     }
   }

   var toggle_collapse = function(ind) {
     cat_data[ind].collapsed = !cat_data[ind].collapsed
     redraw(parseInt(ind))
   }


   var cat_labels = d3.selectAll(".expense-group")
   .append("svg:text")
   .attr("x", 5)
   .attr("y", function(){
     return getY(d3.select(this.parentNode).attr("index"), 0) + rad + top_padding
   })
   .text(function(){
     return `${cat_data[d3.select(this.parentNode).attr("index")].group} (${cat_data[d3.select(this.parentNode).attr("index")].cats.length})`
   })
   .attr("class", "cat-label")
   .on("click", function(){
     toggle_collapse(d3.select(this.parentNode).attr("index"))
   })

   svg.append("g")
   .call(x_axis);









  });

}

init()

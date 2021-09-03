
var bar_height = 25;
var rad = 12.5;

w = window.innerWidth-30
h = window.innerHeight-30

var num =0

//to calculate programmatically
//usually these sorts of defaults would be dangerous, but I do know SOME things about the data, so risk is small
var min_year=9999
var max_year=0
var top_padding = 7
var bottom_padding = 50
var left_margin= 250
var right_margin = 175
var top_margin = 50

var shift = 0


//d3 integration taken from http://www.ng-newsletter.com.s3-website-us-east-1.amazonaws.com/posts/d3-on-angular.html
angular.module('d3', [])
  .factory('d3Service', ['$document', '$q', '$rootScope',
    function($document, $q, $rootScope) {
      var d = $q.defer();
      function onScriptLoad() {
        // Load client in the browser
        $rootScope.$apply(function() { d.resolve(window.d3); });
      }
      // Create a script tag with d3 as the source
      // and call our onScriptLoad callback when it
      // has been loaded
      var scriptTag = $document[0].createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.async = true;
      scriptTag.src = prefix + 'js/d3.min.js';
      scriptTag.onreadystatechange = function () {
        if (this.readyState == 'complete') onScriptLoad();
      }
      scriptTag.onload = onScriptLoad;

      var s = $document[0].getElementsByTagName('body')[0];
      s.appendChild(scriptTag);

      return {
        d3: function() { return d.promise; }
      };
}]);

var app = angular.module('app', [ 'd3', 'ezplus']);


app.controller('ctrl', function($scope, $window, $document) {

  $scope.model = {
    view_mode: false
  }

  $scope.toggle_mode = function(){

    $scope.model.view_mode = !$scope.model.view_mode
    if($scope.model.view_mode) {
      $('#timeline svg').css("display", "none")

    }
    else {
        $('#timeline svg').css("display", "")
      
    }
  }


  /*
  $scope.magnif = function() {
       console.log("here")

        //When the user hovers on the image, the script will first calculate
        //the native dimensions if they don't exist. Only after the native dimensions
        //are available, the script will show the zoomed version.
        if (!native_width && !native_height) {
            //This will create a new image object with the same image as that in .small
            //We cannot directly get the dimensions from .small because of the
            //width specified to 200px in the html. To get the actual dimensions we have
            //created this image object.
            var image_object = new Image();
            image_object.src = $(".small").attr("src");

            //This code is wrapped in the .load function which is important.
            //width and height of the object would return 0 if accessed before
            //the image gets loaded.
            native_width = image_object.width;
            native_height = image_object.height;
        } else {
            //x/y coordinates of the mouse
            //This is the position of .magnify with respect to the document.
            var magnify_offset = $(this).offset();
            //We will deduct the positions of .magnify from the mouse positions with
            //respect to the document to get the mouse positions with respect to the
            //container(.magnify)
            var mx = e.pageX - magnify_offset.left;
            var my = e.pageY - magnify_offset.top;

            //Finally the code to fade out the glass if the mouse is outside the container
            if (mx < $(this).width() && my < $(this).height() && mx > 0 && my > 0) {
                $(".large").fadeIn(100);
            } else {
                $(".large").fadeOut(100);
            }
            if ($(".large").is(":visible")) {
                //The background position of .large will be changed according to the position
                //of the mouse over the .small image. So we will get the ratio of the pixel
                //under the mouse pointer with respect to the image and use that to position the
                //large image inside the magnifying glass
                var rx = Math.round(mx / $(".small").width() * native_width - $(".large").width() / 2) * -1;
                var ry = Math.round(my / $(".small").height() * native_height - $(".large").height() / 2) * -1;
                var bgp = rx + "px " + ry + "px";

                //Time to move the magnifying glass with the mouse
                var px = mx - $(".large").width() / 2;
                var py = my - $(".large").height() / 2;
                //Now the glass moves with the mouse
                //The logic is to deduct half of the glass's width and height from the
                //mouse coordinates to place it with its center at the mouse coordinates

                //If you hover on the image now, you should see the magnifying glass in action
                $(".large").css({
                    left: px,
                    top: py,
                    backgroundPosition: bgp
                });
            }
        }

  }
  */

  //maybe eventually fix the json
  //for now, just rearrange things here
  var draw = function(data) {
    //maybe fix this .. reloading evey time is inefficient
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


  var onResize = function() {
      w = window.innerWidth-30
      h = window.innerHeight-30
      if(!$scope.model.view_mode) {
        d3.select("#timeline").selectAll("*").remove();
        draw()
      }


  }

  angular.element($window).on('resize', function(e){
    $document.ready(function() {
      onResize()
    })
  });
  draw()

})



//init()

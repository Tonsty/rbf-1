var numeric = require('numeric');


var distanceFunctions = {
  'linear': distanceLinear,
  'cubic':  distanceCubic,
  'quintic': distanceQuintic,
  'thin-plate': distanceThinPlate,
  'gaussian': distanceGaussian,
  'inverse-multiquadric': distanceInverseMultiquadric,
  'multiquadric': distanceMultiquadric
};


function RBF(points, values, distanceFunction, epsilon) {

  var distance = distanceFunctions.linear;

  if(distanceFunction) {
    distance = typeof distanceFunction !== 'string'
      ? distanceFunction
      : distanceFunctions[distanceFunction];
  }

  // `identity` here serves as a shorthand to allocate
  // the matrix nested array.
  var M = numeric.identity(points.length);

  // First compute the point to point distance matrix
  // to allow computing epsilon if it's not provided
  for(var j=0; j<points.length; j++) {
    for(var i=0; i<points.length; i++) {
      M[j][i] = norm(points[i], points[j]);
    }
  }

  // if not provided, compute espilon as the average distance between points
  if(epsilon === undefined) {
    epsilon = numeric.sum(M) / (Math.pow(points.length, 2) - points.length);
  }

  // update the matrix to reflect the requested distance function
  for(var j=0; j<points.length; j++) {
    for(var i=0; i<points.length; i++) {
      M[j][i] = distance(M[j][i], epsilon);
    }
  }

  // Compute basis functions weights by solving
  // the linear system of equations
  var LU = numeric.LU(M);
  var w = numeric.LUsolve(LU, values);

  // The returned interpolant will compute the value at any point 
  // by summing the weighted contributions of the input points
  function interpolant(p) {
    var distances = points.map(function(point) {
      return distance(norm(p, point), epsilon);
    });

    var products = numeric.mul(distances, w);
    var sum = products.reduce(function(acc, value) {
      return acc + value;
    }, 0);

    return sum;
  }

  return interpolant;
}


function norm(pa, pb) {
  return numeric.norm2(numeric.sub(pb, pa));
}

function distanceLinear(r) {
  return r;
}

function distanceCubic(r) {
  return Math.pow(r, 3);
}

function distanceQuintic(r) {
  return Math.pow(r, 5);
}

function distanceThinPlate(r) {
  if(r === 0) return 0;
  return Math.pow(r, 2) * Math.log(r);
}

function distanceGaussian(r, epsilon) {
  return Math.exp(- Math.pow(r / epsilon, 2));
}

function distanceInverseMultiquadric(r, epsilon) {
  return 1.0 / Math.sqrt(Math.pow(r / epsilon, 2) + 1);
}

function distanceMultiquadric(r, epsilon) {
  return Math.sqrt(Math.pow(r / epsilon, 2) + 1);
}

module.exports = RBF;
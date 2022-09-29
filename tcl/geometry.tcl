

namespace eval ::geometry {

proc line {x1 y1 x2 y2 width args} {
	return [[screen] create line $x1 $y1 $x2 $y2 -width [expr {round($width)}] {*}$args]
}

# miscellaneous polygons
proc polygon {args} {
	return [[screen] create polygon {*}$args]
}

# draw a circle
# x and y are the centre
# size is the diameter
proc circle {x y size args} {
	set x0 [expr {$x-$size/2}]
	set x1 [expr {$x+$size/2}]
	set y0 [expr {$y-$size/2}]
	set y1 [expr {$y+$size/2}]
	return [[screen] create oval $x0 $y0 $x1 $y1 {*}$args]
}

# draw a square
# x and y give the centre
# size is the length of a side
proc square {x y orientation size args} {
	switch -- $orientation {
		"left" - "right" {
			set short [expr {$size*($::Q3-1)/4}]
			set long  [expr {$size*($::Q3+1)/4}]
			set x1 [expr {$x-$long}]
			set x2 [expr {$x-$short}]
			set x3 [expr {$x+$short}]
			set x4 [expr {$x+$long}]
			set y1 [expr {$y-$long}]
			set y2 [expr {$y-$short}]
			set y3 [expr {$y+$short}]
			set y4 [expr {$y+$long}]
			if {$orientation=="left"} {
				return [[screen] create polygon $x3 $y1 $x4 $y3 $x2 $y4 $x1 $y2 {*}$args]
			} else {
				return [[screen] create polygon $x2 $y1 $x4 $y2 $x3 $y4 $x1 $y3 {*}$args]
			}
		}
		default {
			set x0 [expr {$x-$size/2}]
			set x1 [expr {$x+$size/2}]
			set y0 [expr {$y-$size/2}]
			set y1 [expr {$y+$size/2}]
			return [[screen] create rectangle $x0 $y0 $x1 $y1 {*}$args]
		}
	}
}

# draw a diamond (a square rotated 45 degrees)
# x and y give the centre
# size is the distance from the centre to any corner
proc diamond {x y size args} {
	set x1 [expr {$x-$size}]
	set x2 [expr {$x+$size}]
	set y1 [expr {$y-$size}]
	set y2 [expr {$y+$size}]
	return [[screen] create polygon $x $y1 $x2 $y $x $y2 $x1 $y {*}$args]
}

# draw a rectangle
# x and y give the top left corner
# width and height duh
proc rectangle {x y width height args} {
	set x1 [expr {$x+$width}]
	set y1 [expr {$y+$height}]
	return [[screen] create rectangle $x $y $x1 $y1 {*}$args]
}

# draw an icosceles right-angle triangle
# x y gives the point of the right angle
# orientation is the direction in which the right angle is pointing and must be one of
# the cardinal directions n,e,s,w in which case size is the length of the hypotenuse
# or an intercardinal direction ne,se,sw,nw in which case the size is the length of 
# the shorter sides
# args can be any valid args to the canvas subcommand create polygon
proc RITriangle {x y orientation size args} {

	switch -- $orientation {
		"n" {
			set x1 [expr {$x-$size/2.0}]
			set x2 [expr {$x+$size/2.0}]
			set y1 [expr {$y+$size/2.0}]
			return [[screen] create polygon $x $y $x2 $y1 $x1 $y1 {*}$args]
		}
		"ne" {
			set x1 [expr {$x-$size}]
			set y1 [expr {$y+$size}]
			return [[screen] create polygon $x $y $x $y1 $x1 $y {*}$args]
		}
		"e" {
			set x1 [expr {$x-$size/2.0}]
			set y1 [expr {$y-$size/2.0}]
			set y2 [expr {$y+$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y2 $x1 $y1 {*}$args]
		}
		"se" {
			set x1 [expr {$x-$size}]
			set y1 [expr {$y-$size}]
			return [[screen] create polygon $x $y $x1 $y $x $y1 {*}$args]
		}
		"s" {
			set x1 [expr {$x-$size/2.0}]
			set x2 [expr {$x+$size/2.0}]
			set y1 [expr {$y-$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y1 $x2 $y1 {*}$args]
		}
		"sw" {
			set x1 [expr {$x+$size}]
			set y1 [expr {$y-$size}]
			return [[screen] create polygon $x $y $x $y1 $x1 $y {*}$args]
		}
		"w" {
			set x1 [expr {$x+$size/2.0}]
			set y1 [expr {$y-$size/2.0}]
			set y2 [expr {$y+$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y1 $x1 $y2 {*}$args]
		}
		"nw" {
			set x1 [expr {$x+$size}]
			set y1 [expr {$y+$size}]
			return [[screen] create polygon $x $y $x1 $y $x $y1 {*}$args]
		}
	}
}

# draw an equalateral triangle
# x y is either the top, left, bottom or right point depending on orientation (must be cardinal)
# size is the length of a side
proc equilateralTriangle {x y orientation size args} {

	switch -- $orientation {
		"n" {
			set x1 [expr {$x-$size/2.0}]
			set x2 [expr {$x+$size/2.0}]
			set y1 [expr {$y+$::Q3*$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y1 $x2 $y1 {*}$args]
		}
		"e" {
			set x1 [expr {$x-$::Q3*$size/2.0}]
			set y1 [expr {$y-$size/2.0}]
			set y2 [expr {$y+$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y1 $x1 $y2 {*}$args]
		}
		"s" {
			set x1 [expr {$x-$size/2.0}]
			set x2 [expr {$x+$size/2.0}]
			set y1 [expr {$y-$::Q3*$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y1 $x2 $y1 {*}$args]
		}
		"w" {
			set x1 [expr {$x+$::Q3*$size/2.0}]
			set y1 [expr {$y-$size/2.0}]
			set y2 [expr {$y+$size/2.0}]
			return [[screen] create polygon $x $y $x1 $y1 $x1 $y2 {*}$args]
		}
	}
}

# (triangular tiling)
# draw a trapezoid with two 60 degree angles and two 120 degree angles
# orientation is the orientation of the equilateral triangle that the trapezoid is part of. Must be cardinal direction
# x y is determined by orientation. E.g. if orientation is n, then x,y is the top (north) point of the triangle. 
# direction indicates which corner of the triangle the shorter parallel side is facing
# E.g if the orientation is n, then direction must be one of n, se or sw
# length is the length of the longer parallel side
# height is the distance between the two parallel sides
proc equilateralTrapezoid {x y orientation direction length height args} {
	switch -- "$orientation-$direction" {
		"n-n" {
			set x1 [expr {$x-($length/2)}]
			set x2 [expr {$x-($length/2-$height/$::Q3)}]
			set x3 [expr {$x+($length/2-$height/$::Q3)}]
			set x4 [expr {$x+($length/2)}]
			set y1 [expr {$y+($::Q3*$length/2-$height)}]
			set y2 [expr {$y+($::Q3*$length/2)}]
			return [[screen] create polygon $x1 $y2 $x2 $y1 $x3 $y1 $x4 $y2 {*}$args]
		}
		"n-see" {
			set x1 [expr {$x-($length/2)}]
			set x2 [expr {$x-($length/2 - 2*$height/$::Q3)}]
			set x3 $x
			set x4 [expr {$x+($height/$::Q3)}]
			set y1 $y
			set y2 [expr {$y+$height}]
			set y3 [expr {$y+($length*$::Q3/2)}]
			return [[screen] create polygon $x1 $y3 $x3 $y1 $x4 $y2 $x2 $y3 {*}$args]
		}
		"n-sww" {
			set x1 [expr {$x-($height/$::Q3)}]
			set x2 $x
			set x3 [expr {$x+($length/2 - 2*$height/$::Q3)}]
			set x4 [expr {$x+($length/2)}]
			set y1 $y
			set y2 [expr {$y+$height}]
			set y3 [expr {$y+($length*$::Q3/2)}]
			return [[screen] create polygon $x1 $y2 $x2 $y1 $x4 $y3 $x3 $y3 {*}$args]
		}
		"e-e" {
			set x1 [expr {$x-($::Q3*$length/2)}]
			set x2 [expr {$x-($::Q3*$length/2-$height)}]
			set y1 [expr {$y-($length/2)}]
			set y2 [expr {$y-($length/2-$height/$::Q3)}]
			set y3 [expr {$y+($length/2-$height/$::Q3)}]
			set y4 [expr {$y+($length/2)}]
			return [[screen] create polygon $x1 $y1 $x2 $y2 $x2 $y3 $x1 $y4 {*}$args]
		}
		"e-nnw" {
			set x1 [expr {$x-($length*$::Q3/2)}]
			set x2 [expr {$x-$height}]
			set x3 $x
			set y1 [expr {$y-($height/$::Q3)}]
			set y2 $y
			set y3 [expr {$y+($length/2 - 2*$height/$::Q3)}]
			set y4 [expr {$y+($length/2)}]
			return [[screen] create polygon $x1 $y3 $x2 $y1 $x3 $y2 $x1 $y4 {*}$args]
		}
		"e-ssw" {
			set y1 [expr {$y-($length/2)}]
			set y2 [expr {$y-($length/2 - 2*$height/$::Q3)}]
			set y3 $y
			set y4 [expr {$y+($height/$::Q3)}]
			set x1 [expr {$x-($length*$::Q3/2)}]
			set x2 [expr {$x-$height}]
			set x3 $x
			return [[screen] create polygon $x1 $y1 $x3 $y3 $x2 $y4 $x1 $y2 {*}$args]
		}
		"s-s" {
			set x1 [expr {$x-($length/2)}]
			set x2 [expr {$x-($length/2-$height/$::Q3)}]
			set x3 [expr {$x+($length/2-$height/$::Q3)}]
			set x4 [expr {$x+($length/2)}]
			set y1 [expr {$y-($::Q3*$length/2)}]
			set y2 [expr {$y-($::Q3*$length/2-$height)}]
			return [[screen] create polygon $x1 $y1 $x2 $y2 $x3 $y2 $x4 $y1 {*}$args]
		}
		"s-nee" {
			set x1 [expr {$x-($length/2)}]
			set x2 [expr {$x-($length/2 - 2*$height/$::Q3)}]
			set x3 $x
			set x4 [expr {$x+($height/$::Q3)}]
			set y1 [expr {$y-($length*$::Q3/2)}]
			set y2 [expr {$y-$height}]
			set y3 $y
			return [[screen] create polygon $x1 $y1 $x2 $y1 $x4 $y2 $x3 $y3 {*}$args]
		}
		"s-nww" {
			set x1 [expr {$x-($height/$::Q3)}]
			set x2 $x
			set x3 [expr {$x+($length/2 - 2*$height/$::Q3)}]
			set x4 [expr {$x+($length/2)}]
			set y1 [expr {$y-($length*$::Q3/2)}]
			set y2 [expr {$y-$height}]
			set y3 $y
			return [[screen] create polygon $x1 $y2 $x3 $y1 $x4 $y1 $x2 $y3 {*}$args]
		}
		"w-w" {
			set x1 [expr {$x+($::Q3*$length/2-$height)}]
			set x2 [expr {$x+($::Q3*$length/2)}]
			set y1 [expr {$y-($length/2)}]
			set y2 [expr {$y-($length/2-$height/$::Q3)}]
			set y3 [expr {$y+($length/2-$height/$::Q3)}]
			set y4 [expr {$y+($length/2)}]
			return [[screen] create polygon $x1 $y2 $x2 $y1 $x2 $y4 $x1 $y3 {*}$args]
		}
		"w-nne" {
			set x1 $x
			set x2 [expr {$x+$height}]
			set x3 [expr {$x+($length*$::Q3/2)}]
			set y1 [expr {$y-($height/$::Q3)}]
			set y2 $y
			set y3 [expr {$y+($length/2 - 2*$height/$::Q3)}]
			set y4 [expr {$y+($length/2)}]
			return [[screen] create polygon $x1 $y2 $x2 $y1 $x3 $y3 $x3 $y4 {*}$args]
		}
		"w-sse" {
			set x1 $x
			set x2 [expr {$x+$height}]
			set x3 [expr {$x+($length*$::Q3/2)}]
			set y1 [expr {$y-($length/2)}]
			set y2 [expr {$y-($length/2 - 2*$height/$::Q3)}]
			set y3 $y
			set y4 [expr {$y+($height/$::Q3)}]
			return [[screen] create polygon $x1 $y3 $x3 $y1 $x3 $y2 $x2 $y4 {*}$args]
		}
	}
}

# draw a pentagon, either with horizontal bottom, and a point at the top (orientation = "up"), 
# or vice-versa (orientation = "down") 
# and  x and y are centre
# size is length of a side
proc pentagon {x y orientation size args} {
	switch -- $orientation {
		"up" {
			set x1 [expr {$x - (1 + $::Q5)*$size/4}]
			set x2 [expr {$x - $size/2}]
			set x3 $x
			set x4 [expr {$x + $size/2}]
			set x5 [expr {$x + (1 + $::Q5)*$size/4}]

			set y1 [expr {$y - $size*sqrt(2/(5 - $::Q5))}]
			set y2 [expr {$y - sqrt(3 - $::Q5)*$size/(2*sqrt(5 - $::Q5))}]
			set y3 [expr {$y + (sqrt(15 + 5*$::Q5) - 2*$::Q2)*$size/(2*sqrt(5 - $::Q5))}]
			.c create polygon $x3 $y1 $x5 $y2 $x4 $y3 $x2 $y3 $x1 $y2 {*}$args
		}
		"down" {
			set x1 [expr {$x - (1 + $::Q5)*$size/4}]
			set x2 [expr {$x - $size/2}]
			set x3 $x
			set x4 [expr {$x + $size/2}]
			set x5 [expr {$x + (1 + $::Q5)*$size/4}]

			set y1 [expr {$y - (sqrt(15 + 5*$::Q5) - 2*$::Q2)*$size/(2*sqrt(5 - $::Q5))}]
			set y2 [expr {$y + sqrt(3 - $::Q5)*$size/(2*sqrt(5 - $::Q5))}]
			set y3 [expr {$y + $size*sqrt(2/(5 - $::Q5))}]
			.c create polygon $x2 $y1 $x4 $y1 $x5 $y2 $x3 $y3 $x1 $y2 {*}$args
		}
	}
}

# formulas for calculating the sides of right triangles on pentagons etc.
# 18-72 right triangle:
# hypotenuse = 1
# long = sin(72) = cos(18) = ~0.951057 = sqrt(10 + 2*Q5)/4
# short = cos(72) = sin(18) = ~0.309017  = 1/(Q5 + 1)

# long = 1
# hypotenuse = 1/sin(72) = 1/cos(18) = ~1.051462 = 4/sqrt(10 + 2*Q5)
# short = 1/tan(72) = tan(18) = ~0.324920 = 1/sqrt(5 + 2*Q5)

# short = 1
# hypotenuse = 1/sin(18) = 1/cos(72) = ~3.236068 = Q5 + 1
# long = tan(72) = 1/tan(18) = ~3.077684 = sqrt(5 + 2*Q5)

# 36-54 right triangle
# hypotenuse = 1
# long = sin(54) = cos(36) = ~0.809017 = 1/(Q5 - 1)
# short = cos(54) = sin(36) = ~0.587785 = sqrt(10 - 2*Q5)/4

# long = 1
# hypotenuse = 1/sin(54) = 1/cos(36) = ~1.236068 = Q5 - 1
# short = 1/tan(54) = tan(36) = ~0.726543 = sqrt(5 - 2*Q5)

# short = 1
# hypotenuse = 1/sin(36) = 1/cos(54) = ~1.701302 = 4/sqrt(10 - 2*Q5)
# long = tan(54) = 1/tan(36) = ~1.376382 = 1/sqrt(5 - 2*Q5)

# formulas for lengths on a pentagram:
# A is the length of an entire line, between two outer points. AKA width
# B is the length of a line from any point to the furthest inner point
# C is the length of a side, from outer poin to the nearest inner point
# D is the side length of the inner pentagon, between two adjacent inner points
# based on C = 1:
# A = (Q5 + 3)/2
# B = (Q5 + 1)/2
# C = 1
# D = (Q5 - 1)/2
# A/B = B/C = C/D = B = golden ratio


# five-sided star
# size is length of the side of the points, from tip to base
proc pentagram {x y orientation size args} {
	switch -- $orientation {
		"up" {
			set x1 [expr {$x - $size*(1 + $::Q5)**2/8}]
			set x2 [expr {$x - $size*(1 + $::Q5)/4}]
			set x3 $x
			set x4 [expr {$x + $size*(1 + $::Q5)/4}]
			set x5 [expr {$x + $size*(1 + $::Q5)**2/8}]

			set y1 [expr {$y - $size*sqrt(2/(5 - $::Q5))*(1 + $::Q5)/2}]
			set y2 [expr {$y - (1 + $::Q5)*$size/(2*sqrt(10 + 2*$::Q5))}]
			set y3 [expr {$y + (1 + $::Q5)*$size/(4*sqrt(5 - 2*$::Q5))}]

			.c create polygon $x3 $y1 $x4 $y3 $x1 $y2 $x5 $y2 $x2 $y3 {*}$args
		}
		"down" {
			set x1 [expr {$x - $size*(1 + $::Q5)**2/8}]
			set x2 [expr {$x - $size*(1 + $::Q5)/4}]
			set x3 $x
			set x4 [expr {$x + $size*(1 + $::Q5)/4}]
			set x5 [expr {$x + $size*(1 + $::Q5)**2/8}]

			set y1 [expr {$y - (1 + $::Q5)*$size/(4*sqrt(5 - 2*$::Q5))}]
			set y2 [expr {$y + (1 + $::Q5)*$size/(2*sqrt(10 + 2*$::Q5))}]
			set y3 [expr {$y + $size*sqrt(2/(5 - $::Q5))*(1 + $::Q5)/2}]

			.c create polygon $x2 $y1 $x3 $y3 $x4 $y1 $x1 $y2 $x5 $y2 {*}$args
		}
	}
}

# (for penrose tiling) 3 points of a pentagram - looks like a boat
# points are 3 of (n, nee, sse, ssw, nww) if orientation is up, or (nne, see, s, sww, nnw) for orientation down
proc pentaboat {x y orientation points size args} {
	switch -- $orientation {
		"up" {
			set x1 [expr {$x - $size*(1 + $::Q5)**2/8}]
			set x2 [expr {$x - $size*(1 + $::Q5)/4}]
			set x3 $x
			set x4 [expr {$x + $size*(1 + $::Q5)/4}]
			set x5 [expr {$x + $size*(1 + $::Q5)**2/8}]

			set y1 [expr {$y - $size*sqrt(2/(5 - $::Q5))*(1 + $::Q5)/2}]
			set y2 [expr {$y - (1 + $::Q5)*$size/(2*sqrt(10 + 2*$::Q5))}]
			set y3 [expr {$y + (1 + $::Q5)*$size/(4*sqrt(5 - 2*$::Q5))}]

			set points {}
			if {"n" in $points} { lappend points }

			.c create polygon $x3 $y1 $x4 $y3 $x1 $y2 $x5 $y2 $x2 $y3 {*}$args
		}
		"down" {
			set x1 [expr {$x - $size*(1 + $::Q5)**2/8}]
			set x2 [expr {$x - $size*(1 + $::Q5)/4}]
			set x3 $x
			set x4 [expr {$x + $size*(1 + $::Q5)/4}]
			set x5 [expr {$x + $size*(1 + $::Q5)**2/8}]

			set y1 [expr {$y - (1 + $::Q5)*$size/(4*sqrt(5 - 2*$::Q5))}]
			set y2 [expr {$y + (1 + $::Q5)*$size/(2*sqrt(10 + 2*$::Q5))}]
			set y3 [expr {$y + $size*sqrt(2/(5 - $::Q5))*(1 + $::Q5)/2}]

			.c create polygon $x2 $y1 $x3 $y3 $x4 $y1 $x1 $y2 $x5 $y2 {*}$args
		}
	}
}

# (for penrose tiling) 1 point of a pentagram
# point is one of (n, nee, sse, ssw, nww) if orientation is up, or (nne, see, s, sww, nnw) for orientation down
proc pentashard {x y orientation point size args} {
}

# draw a hexagon, either with 2 horizontal sides at the top and bottom (orientation = "flat"), 
# or two vertical sides (orientation = "standing") 
# and  x and y are centre
# size is length of a side
proc hexagon {x y orientation size args} {

	switch -- $orientation {
		"flat" {
			set x1 [expr {$x-$size}]
			set x2 [expr {$x-$size/2}]
			set x3 [expr {$x+$size/2}]
			set x4 [expr {$x+$size}]

			set y1 [expr {$y-$::Q3*$size/2}]
			set y2 $y
			set y3 [expr {$y+$::Q3*$size/2}]

			return [[screen] create polygon $x2 $y1 $x3 $y1 $x4 $y2 $x3 $y3 $x2 $y3 $x1 $y2 {*}$args]
		}
		"standing" {
			set x1 [expr {$x-$::Q3*$size/2}]
			set x2 $x
			set x3 [expr {$x+$::Q3*$size/2}]

			set y1 [expr {$y-$size}]
			set y2 [expr {$y-$size/2}]
			set y3 [expr {$y+$size/2}]
			set y4 [expr {$y+$size}]

			return [[screen] create polygon $x2 $y1 $x3 $y2 $x3 $y3 $x2 $y4 $x1 $y3 $x1 $y2 {*}$args]
		}
	}
}

# draw a regular octagon with horizontal and vertical sides
# x y is centre of octagon, size is side length
proc octagon {x y size args} {

	set x1 [expr {$x - $size*($::Q2+1)/2}]
	set x2 [expr {$x - $size/2}]
	set x3 [expr {$x + $size/2}]
	set x4 [expr {$x + $size*($::Q2+1)/2}]
	set y1 [expr {$y - $size*($::Q2+1)/2}]
	set y2 [expr {$y - $size/2}]
	set y3 [expr {$y + $size/2}]
	set y4 [expr {$y + $size*($::Q2+1)/2}]

	return [[screen] create polygon $x2 $y1 $x3 $y1 $x4 $y2 $x4 $y3 $x3 $y4 $x2 $y4 $x1 $y3 $x1 $y2 {*}$args]
}

proc dodecagon {x y size args} {

	set x1 [expr {$x - $size*($::Q3+2)/2}]
	set x2 [expr {$x - $size*($::Q3+1)/2}]
	set x3 [expr {$x - $size/2}]
	set x4 [expr {$x + $size/2}]
	set x5 [expr {$x + $size*($::Q3+1)/2}]
	set x6 [expr {$x + $size*($::Q3+2)/2}]
	set y1 [expr {$y - $size*($::Q3+2)/2}]
	set y2 [expr {$y - $size*($::Q3+1)/2}]
	set y3 [expr {$y - $size/2}]
	set y4 [expr {$y + $size/2}]
	set y5 [expr {$y + $size*($::Q3+1)/2}]
	set y6 [expr {$y + $size*($::Q3+2)/2}]

	return [[screen] create polygon $x3 $y1 $x4 $y1 $x5 $y2 $x6 $y3 $x6 $y4 $x5 $y5 $x4 $y6 $x3 $y6 $x2 $y5 $x1 $y4 $x1 $y3 $x2 $y2 {*}$args]
}

# end namespace
}
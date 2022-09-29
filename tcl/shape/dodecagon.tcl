
namespace eval ::dodecagon {
# dodecagon

dict set coordinate "n face"    x 0
dict set coordinate "n face"    y [expr {0 - $size*($::Q3+2)/2}]
dict set coordinate "nne point" x [expr {0 + $size/2}]
dict set coordinate "nne point" y [expr {0 - $size*($::Q3+2)/2}]
dict set coordinate "nne face"  x [expr {0 + $size*($::Q3+2)/4}]
dict set coordinate "nne face"  y [expr {0 - $size*(2*$::Q3+3)/4}]
dict set coordinate "ne point"  x [expr {0 + $size*($::Q3+1)/2}]
dict set coordinate "ne point"  y [expr {0 - $size*($::Q3+1)/2}]
dict set coordinate "nee face"  x [expr {0 + $size*(2*$::Q3+3)/4}]
dict set coordinate "nee face"  y [expr {0 - $size*($::Q3+2)/4}]
dict set coordinate "nee point" x [expr {0 + $size*($::Q3+2)/2}]
dict set coordinate "nee point" y [expr {0 - $size/2}]
dict set coordinate "e face"    x [expr {0 + $size*($::Q3+2)/2}]
dict set coordinate "e face"    y 0
dict set coordinate "see point" x [expr {0 + $size*($::Q3+2)/2}]
dict set coordinate "see point" y [expr {0 + $size/2}]
dict set coordinate "see face"  x [expr {0 + $size*(2*$::Q3+3)/4}]
dict set coordinate "see face"  y [expr {0 + $size*($::Q3+2)/4}]
dict set coordinate "se point"  x [expr {0 + $size*($::Q3+1)/2}]
dict set coordinate "se point"  y [expr {0 + $size*($::Q3+1)/2}]
dict set coordinate "sse face"  x [expr {0 + $size*($::Q3+2)/4}]
dict set coordinate "sse face"  y [expr {0 + $size*(2*$::Q3+3)/4}]
dict set coordinate "sse point" x [expr {0 + $size/2}]
dict set coordinate "sse point" y [expr {0 + $size*($::Q3+2)/2}]
dict set coordinate "s face"    x 0
dict set coordinate "s face"    y [expr {0 + $size*($::Q3+2)/2}]
dict set coordinate "ssw point" x [expr {0 - $size/2}]
dict set coordinate "ssw point" y [expr {0 + $size*($::Q3+2)/2}]
dict set coordinate "ssw face"  x [expr {0 - $size*($::Q3+2)/4}]
dict set coordinate "ssw face"  y [expr {0 + $size*(2*$::Q3+3)/4}]
dict set coordinate "sw point"  x [expr {0 - $size*($::Q3+1)/2}]
dict set coordinate "sw point"  y [expr {0 + $size*($::Q3+1)/2}]
dict set coordinate "sww face"  x [expr {0 - $size*(2*$::Q3+3)/4}]
dict set coordinate "sww face"  y [expr {0 + $size*($::Q3+2)/4}]
dict set coordinate "sww point" x [expr {0 - $size*($::Q3+2)/2}]
dict set coordinate "sww point" y [expr {0 + $size/2}]
dict set coordinate "w face"    x [expr {0 - $size*($::Q3+2)/2}]
dict set coordinate "w face"    y 0
dict set coordinate "nww point" x [expr {0 - $size*($::Q3+2)/2}]
dict set coordinate "nww point" y [expr {0 - $size/2}]
dict set coordinate "nww face"  x [expr {0 - $size*(2*$::Q3+3)/4}]
dict set coordinate "nww face"  y [expr {0 - $size*($::Q3+2)/4}]
dict set coordinate "nw point"  x [expr {0 - $size*($::Q3+1)/2}]
dict set coordinate "nw point"  y [expr {0 - $size*($::Q3+1)/2}]
dict set coordinate "nnw face"  x [expr {0 - $size*($::Q3+2)/4}]
dict set coordinate "nnw face"  y [expr {0 - $size*(2*$::Q3+3)/4}]
dict set coordinate "nnw point" x [expr {0 - $size/2}]
dict set coordinate "nnw point" y [expr {0 - $size*($::Q3+2)/2}]

# truncated hexagon

proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX [expr {4*$size-1}]
	set maxY [expr {4*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# the tile size will be restricted by either the width or the height
	if {[xPixels $yPixels $size]<$xPixels} {
		# tile size is restricted by the screen height
		set xPixels [xPixels $yPixels $size]
		set tile_pixels [expr {2*$yPixels/($size*(2*$::Q3+3)+1)}]
	} else {
		set yPixels [yPixels $xPixels $size]
		set tile_pixels [expr {2*$xPixels/((2*$size+1)*($::Q3+2))}]
	}
	::grid::set yPixels $yPixels
	::grid::set xPixels $xPixels
	::grid::set tile_pixels $tile_pixels

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {round($tile_pixels/$::Q3)}]
	set path_width [expr {max($diameter/5,1)}]
	set node_diameter [expr {$diameter - $path_width}]

	::grid::set path_width $path_width
	::grid::set node_diameter $node_diameter

	for {set column 0} {$column<=$maxX} {incr column} {
		::grid::set column_locations $column [column_locations $column]
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row dodecagon straight [row_locations $row hexagon straight]
		::grid::set row_locations $row triangle n [row_locations $row triangle n]
		::grid::set row_locations $row triangle s [row_locations $row triangle s]
	}

	::triangle::new_grid
	::hexagon::new_grid
}

proc column_locations {column} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]

	set column_width [expr {$tilePixels*($::Q3 + 2)/2}]
	set column_centre [expr {$column_width*($column+1)}]

	set locations {}
	if {($column_centre - $xPixels + $tile_pixels*($::Q3 + 2)) > (0-$padLeft)} {
		lappend locations [expr {($column_centre - $xPixels + $tile_pixels)+$offsetx}]
	}
	lappend locations [expr {$column_centre+$offsetx}]
	if {($column_centre + $xPixels - $tile_pixels*($::Q3 + 2)) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_centre + $xPixels - $tile_pixels)+$offsetx}]
	}

	return $locations
}

proc row_locations {row shape orientation} {
	set tile_pixels [::grid::get tile_pixels]
	set yPixels [::grid::get yPixels]
	set padTop [::grid::get pad_top]
	set padBottom [::grid::get pad_bottom]
	set offsety [::grid::get offsety]
	set maxY [::grid::get max_y]
	set continuous [::grid::get continuous_y]

	set row_height [expr {$tilePixels*(2*$::Q3 + 3)/4}]
	set row_centre [expr {$row_height*($row+1)}]
	switch -- "$shape-$orientation" {
		"dodecagon-straight" { set row_centre [expr {$row_centre + $tilePixels/4}] }
		"triangle-n"         { set row_centre [expr {$row_centre - $tilePixels/(2*$::Q3)}] }
		"triangle-s"         { set row_centre [expr {$row_centre + $tilePixels*($::Q3 + 1)/(2*$::Q3)}] }
	}

	set locations {}
	if {$continuous && ($row_centre - $yPixels + $tile_pixels*($::Q3 + 2)) > (0-$padTop)} {
		lappend locations [expr {($row_centre - $yPixels)+$offsety}]
	}
	lappend locations [expr {$row_centre+$offsety}]
	if {$continuous && ($row_centre + $yPixels - $tile_pixels*($::Q3 + 2)) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_centre + $yPixels)+$offsety}]
	}
	return $locations
}

proc x_pixels {size y_pixels} {
	return [expr {$y_pixels*(4*$size+1)*($::Q3+2)/($size*(2*$::Q3+3)+1)}]
}

proc y_pixels {size x_pixels} {
	return [expr {$x_pixels*($size*(2*$::Q3+3)+1)/((4*$size+1)*($::Q3+2))}]
}

proc shape {x y} {
	if {$y%2==0} {
		return "dodecagon"
	} else {
		return "triangle"
	}
}

proc orientation {x y} {
	if {[shape $x $y]=="dodecagon"} {
		return "straight"
	} elseif {($x+$y/2)%2==0} {
		return "s"
	} else {
		return "n"
	}
}

# the southward pointing triangles that appear at the top initially have y = max_y, same as the northward pointing triangles at the bottom
# this neighbour system is exactly the same as trihexagonal, with 6 extra directions where the dodecagons touch
proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set X $x
	set Y $y
	switch -- $direction {
		"n" {
			set D "s"
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"nne" {
			# dodecagon only
			set D "ssw"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y -2]<0} {set Y [expr {$maxY-1}]}
		}
		"nee" {
			set D "sww"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"e" {
			set D "w"
			if {[incr X 2]>$maxX} {set X 0}
		}
		"see" {
			set D "nww"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"sse" {
			set D "nnw"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y 2]>$maxY} {set Y 0}
		}
		"s" {
			set D "n"
			if {[incr Y]>$maxY} {set Y 0}
		}
		"sww" {
			set D "nee"
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"nww" {
			set D "see"
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y -1]<0} {set Y $maxY}
		}
	}

	return [list $X $Y $D]
}

proc tile_location

# truncated trihexagonal

proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX [expr {8*$size-1}]
	set maxY [expr {4*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# the tile size will be restricted by either the width or the height
	if {[xPixels $yPixels $size]<$xPixels} {
		# tile size is restricted by the screen height
		set xPixels [xPixels $yPixels $size]
		set tile_pixels [expr {2*$yPixels/(6*$size*($::Q3 + 1) + $::Q3 + 1)}]
	} else {
		set yPixels [yPixels $xPixels $size]
		set tile_pixels [expr {2*$xPixels/(4*$size*($::Q3 + 3) + $::Q3 + 1)}]
	}
	::grid::set yPixels $yPixels
	::grid::set xPixels $xPixels
	::grid::set tile_pixels $tile_pixels

	# diameter of the largest circle that will fit inside a square
	set diameter $tile_pixels
	set path_width [expr {max($diameter/5,1)}]
	set node_diameter [expr {$diameter - $path_width}]

	::grid::set path_width $path_width
	::grid::set node_diameter $node_diameter

	for {set column 0} {$column<=$maxX} {incr column} {
		if {$column%2==0} {
			::grid::set column_locations $column "dodecagon" "straight" [column_locations $column dodecagon straight]
			::grid::set column_locations $column "hexagon"   "flat"     [column_locations $column hexagon flat]
			::grid::set column_locations $column "square"    "straight" [column_locations $column square straight]
		} else {
			::grid::set column_locations $column "square"    "left"     [column_locations $column square left]
			::grid::set column_locations $column "square"    "right"    [column_locations $column square right]
		}
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row "hexagon"  "standing"  [row_locations $row hexagon standing]
		::grid::set row_locations $row "square"   "straight"  [row_locations $row square straight]
		::grid::set row_locations $row "square"   "left"      [row_locations $row square left]
		::grid::set row_locations $row "square"   "right"     [row_locations $row square right]
		::grid::set row_locations $row "triangle" "n"         [row_locations $row triangle n]
		::grid::set row_locations $row "triangle" "s"         [row_locations $row triangle s]
	}

	::triangle::new_grid
	::hexagon::new_grid
}

proc x_pixels {size y_pixels} {
	return [expr {$y_pixels*(4*$size*($::Q3 + 3) + $::Q3 + 1)/(6*$size*($::Q3 + 1) + $::Q3 + 1)}]
}

proc y_pixels {size x_pixels} {
	return [expr {$x_pixels*(6*$size*($::Q3 + 1) + $::Q3 + 1)/(4*$size*($::Q3 + 3) + $::Q3 + 1)}]
}

proc shape {x y} {
	if {$x%2==1 || ($x+$y)%4==2} {
		return "square"
	} elseif {($x+$y)%4==0} {
		return "dodecagon"
	} else {
		return "hexagon"
	}
}

proc orientation {x y} {
	set shape [shape $x $y]

	if {$x%2==1} {
		# square
		if {($x + $y)%4==0} {
			return "right"
		} else {
			return "left"
		}
	} elseif {($x + $y)%2 == 0} {
		# dodecagon or square
		return "straight"
	} else {
		# hexagon
		return "flat"
	}
}

# like the rhombitrihexagonal tiling
# not possible however to keep the logic consistent per direction
# all other tilings it is possible but not here :(
# the hexagons are the problem, there's basically two different kinds
# hexagon type A has a dodecagon to the n, see and sww, and x+y %4 == 1
# hexagon type B has a dodecagon to the s, nee and nww, and x+y %4 == 3
proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set X $x
	set Y $y

	switch -- $direction {
		"n" {
			# dodecagon, hexagon, straight square -- all same
			set D "s"
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"nne" {
			# dodecagon, right square -- both same
			set D "ssw"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y -1]<0} {set Y $maxY}
		}
		"nee" {
			# dodecagon, hexagon, left square
			# dodecagon, hexagon(b) y- x++
			# hexagon(a), left square x+
			set D "sww"
			if {($x+$y)%4 == 0 || ($x+$y)%4 == 3} {
				if {[incr X 2]>$maxX} {set X 0}
				if {[incr Y -1]<0} {set Y $maxY}
			} else {
				if {[incr X]>$maxX} {set X 0}
			}
		}
		"e" {
			# dodecagon, straight square - both same
			set D "w"
			if {[incr X 2]>$maxX} {set X 0}
		}
		"see" {
			# dodecagon, hexagon, right square
			# dodecagon, hexagon(a) y+ x++
			# hexagon(b), square x+
			set D "nww"
			if {$x%2==0 && ($x+$y)%4 != 3} {
				if {[incr X 2]>$maxX} {set X 0}
				if {[incr Y]>$maxY} {set Y 0}
			} else {
				if {[incr X]>$maxX} {set X 0}
			}
		}
		"sse" {
			# dodecagon, left square - both same
			set D "nnw"
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y]>$maxY} {set Y 0}
		}
		"s" {
			# dodecagon, hexagon, straight square - all same
			set D "n"
			if {[incr Y]>$maxY} {set Y 0}
		}
		"ssw" {
			# dodecagon, right square - both same
			set D "nne"
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y]>$maxX} {set Y 0}
		}
		"sww" {
			# dodecagon, hexagon, left square
			# dodecagon, hexagon (a) x-- y+
			# hexagon (b), left square x-
			set D "nee"
			if {($x + $y)%4 <= 1} {
				if {[incr X -2]<0} {set X $maxX}
				if {[incr Y]>$maxY} {set Y 0}
			} else {
				if {[incr X -1]<0} {set X $maxX}
			}
		}
		"w" {
			# dodecagon, straight square - both same
			set D "e"
			if {[incr x -2]<0} {set X $maxX}
		}
		"nww" {
			# dodecagon, hexagon, right square
			# dodecagon, hexagon (b) x-- y-
			# hexagon (a), right square x-
			set D "see"
			if {($x - $y)%4 <= 1} {
				if {[incr X -2]<0} {set X $maxX}
				if {[incr Y -1]<0} {set Y $maxY}
			} else {
				if {[incr X -1]<0} {set X $maxX}
			}
		}
		"nnw" {
			# dodecagon, left square - both same
			set D "sse"
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y -1]<0} {set Y $maxY}
		}
	}

	return [list $X $Y $D]
}


}
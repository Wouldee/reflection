
namespace eval ::triangular {

proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	::grid::set continuous_x 0
	::grid::set continuous_y 0

	set maxX [expr {$size+1}]
	set maxY [expr {$size+1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	logToFile "xPixels=$xPixels,yPixels=$yPixels,size=$size"
	if {$::Q3*$xPixels<2*$yPixels} {
		logToFile "$::Q3*$xPixels<2*$yPixels, adjust yPixels"
		set yPixels [expr {$::Q3*$xPixels/2}]
		set tile_pixels [expr {$xPixels/($size+2)}]
		logToFile "new yPixels=$yPixels, tile_pixels=$tile_pixels"
	} else {
		logToFile "$::Q3*$xPixels>2*$yPixels, adjust xPixels"
		set xPixels [expr {2*$yPixels/$::Q3}]
		set tile_pixels [expr {2*$yPixels/($::Q3*($size+2))}]
		logToFile "new xPixels=$xPixels, tile_pixels=$tile_pixels"
	}

	::grid::set xPixels $xPixels
	::grid::set yPixels $yPixels
	::grid::set tile_pixels $tile_pixels

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {$tile_pixels/$::Q3}]
	::grid::set node_diameter [expr {round(9*$diameter/10)}]
	::grid::set path_width [expr {max(round($diameter/5),1)}]

	for {set column 0} {$column<=2*$maxX} {incr column} {
		# determine location
		set pointx [expr {$xPixels*($column+1)/(2*($size+2))}]
		# apply offset
		set pointx [expr {$pointx+$offsetx}]
		
		::grid::set column_point $column [list $pointx]
	}

	for {set row 0} {$row<=$maxY+1} {incr row} {
		# determine location
		set pointy [expr {$yPixels*$row/($size+2)}]
		# apply offset
		set pointy [expr {$pointy+$offsety}]

		::grid::set row_point $row [list $pointy]
	}

	::triangle::new_grid
}

proc xPixels {yPixels size} {return [expr {2*$yPixels/$::Q3}]}
proc yPixels {xPixels size} {return [expr {$::Q3*$xPixels/2}]}

proc continuous_x {} {return 0}
proc continuous_y {} {return 0}
proc filters {} {return 0}
proc prisms {} {return 0}

proc complexity {} {
	return 2.0
}

proc tiles {size} {
	return [expr {($size+2)**2}]
}

proc faces {} {
	return 3.0
}

}

namespace eval ::triangular::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	return "triangle"
}

proc orientation {x y} {
	if {min($x,$y)%2==0} {
		# point is downward
		return "s"
	} else {
		# point is upward
		return "n"
	}
}

proc tiles {} {
	return [::triangular::tiles [::grid::get size]]
}

proc faces {} {
	return [::triangular::faces]
}

proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set X $x
	set Y $y

	switch -- $direction {
		"n" {
			if {$x<$y} { incr X } elseif {[incr Y -1]<0} { return {} }
			set D "s"
		}
		"see" {
			if {[incr X]>$maxX} {return {}}
			if {[incr Y]>$maxY} {return {}}
			set D "nww"
		}
		"sww" {
			if {$y<$x} { incr Y	} elseif {[incr X -1]<0} { return {} }
			set D "nee"
		}
		"nww" {
			incr X -1
			incr Y -1
			set D "see"
		}
		"nee" {
			if {$x<$y} { incr X	} else { incr Y -1 }
			set D "sww"
		}
		"s" {
			if {$y<$x} { incr Y } else { incr X -1 }
			set D "n"
		}
	}

	return [list $X $Y $D]
}

# return the x and y location on the canvas, in pixels, 
# of either the top or bottom point of the triangle
proc tile_location {x y} {
	if {$x>$y} {
		set column [expr {(4*$x-$y)/2}]
		set row [expr {$y/2}]
		if {$y%2==0} {incr row}
	} else {
		set column [expr {($x+2*$y)/2}]
		set row [expr {(2*$y-$x)/2}]
		if {$x%2==0} {incr row}
	}

	set pointx [::grid::get column_point $column]
	set pointy [::grid::get row_point $row]
	return [list $pointx $pointy]
}

proc tile_at {pixelx pixely} {
	set size [::grid::get size]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	# apply offsets first
	set pixelx [expr {$pixelx-$offsetx}]
	set pixely [expr {$pixely-$offsety}]

	# check we are inside the grid
	if {$pixely<0 || $pixely>$::Q3*$pixelx || $pixely>$::Q3*($xPixels-$pixelx)} {return {}}

	# rank is which column running /-wise from the top-left corner
	set rank [expr {int(($size+2)*($::Q3*$pixelx+$pixely)/(2*$yPixels))}]

	# depth is which row
	set depth [expr {int(($size+2)*$pixely/$yPixels)}]

	if {$pixely<=$::Q3*($pixelx-($xPixels*($rank-$depth)/($size+2)))} {
		# downward pointing triangle
		if {$rank>=(2*$depth)} {
			set x $rank
			set y [expr {2*$depth}]
		} else {
			set x [expr {2*($rank-$depth)}]
			set y $rank
		}
	} else {
		# upward pointing triangle
		if {$rank>=(2*$depth+1)} {
			set x $rank
			set y [expr {2*$depth+1}]
		} else {
			set x [expr {2*($rank-$depth)-1}]
			set y $rank
		}
	}

	return [list $x $y]
}

}

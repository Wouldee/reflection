
namespace eval ::truncatedSquare {

# octagons and squares
# top-left and bottom-right corners are octagons
# top-right and bottom-left corners are squares
proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX [expr {2*$size-1}]
	set maxY [expr {2*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# like the hexagonal tiling, 
	# the width of each octagon is tile_pixels + 2*(tile_pixels/sqrt(2))
	# but beacause of overlapping each octagon only really takes up tile_pixels/sqrt(2)
	# the extra plus one is to add enough room so that all octagons are displayed completely at all times
	# similar to the hexagonal horizontal tiling
	if {$xPixels<$yPixels} {
		set pixels $xPixels
	} else {
		set pixels $yPixels
	}
	set tile_pixels [expr {$::Q2*$pixels/(2*$size*($::Q2+1)+1)}]

	::grid::set xPixels $pixels
	::grid::set yPixels $pixels
	::grid::set tile_pixels $tile_pixels

	# diameter of the largest circle that will fit inside a square
	set diameter $tile_pixels
	::grid::set node_diameter [expr {round(9*$diameter/10)}]
	::grid::set path_width [expr {max(round($diameter/5),1)}]

	for {set column 0} {$column<=$maxX} {incr column} {
		::grid::set column_locations $column [column_locations $column]
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row [row_locations $row]
	}

	::square::new_grid
	::octagon::new_grid
}

proc xPixels {yPixels size} {return $yPixels}
proc yPixels {xPixels size} {return $xPixels}

proc column_locations {column} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]

	set column_location [expr {$tile_pixels*($column*($::Q2+2)+$::Q2+1)/2}]

	if {($column_location - $xPixels + $tile_pixels*($::Q2+1)/2) > (0-$padLeft)} {
		lappend locations [expr {($column_location - $xPixels + $tile_pixels/$::Q2)+$offsetx}]
	}

	lappend locations [expr {$column_location+$offsetx}]

	if {($column_location + $xPixels - $tile_pixels*($::Q2+1)/2) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_location + $xPixels - $tile_pixels/$::Q2)+$offsetx}]
	}

	return $locations
}

proc row_locations {row} {
	set tile_pixels [::grid::get tile_pixels]
	set yPixels [::grid::get yPixels]
	set padTop [::grid::get pad_top]
	set padBottom [::grid::get pad_bottom]
	set offsety [::grid::get offsety]

	set row_location [expr {$tile_pixels*($row*($::Q2+2)+$::Q2+1)/2}]

	if {($row_location - $yPixels + $tile_pixels*($::Q2+1)/2) > (0-$padTop)} {
		lappend locations [expr {($row_location - $yPixels + $tile_pixels/$::Q2)+$offsety}]
	}

	lappend locations [expr {$row_location+$offsety}]

	if {($row_location + $yPixels - $tile_pixels*($::Q2+1)/2) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_location + $yPixels - $tile_pixels/$::Q2)+$offsety}]
	}

	return $locations
}

proc continuous_x {} {return 1}
proc continuous_y {} {return 1}
proc filters {} {return ""}
proc prisms {} {return ""}

proc complexity {} {
	# about 5.7
	return [expr {17.0/3}]
}

proc tiles {size} {
	return [expr {4*$size**2}]
}

proc faces {} {
	return 6.0
}

}

namespace eval ::truncatedSquare::tiling {
	namespace import -force ::tiling::standard::*
	namespace export *

proc shape {x y} {
	if {($x+$y)%2==0} {
		return "octagon"
	} else {
		return "square"
	}
}

proc orientation {x y} {
	return "straight"
}

proc tiles {} {
	return [::truncatedSquare::tiles [::grid::get size]]
}

proc faces {} {
	return [::truncatedSquare::faces]
}

# return a random integer from 0 to n-1 where n is the number of faces on the tile @ x,y
proc random_rotation {x y} {
	if {[shape $x $y]=="square"} {
		return [expr {int(rand()*4)}]
	} else {
		return [expr {int(rand()*8)}]
	}
}

proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set X $x
	set Y $y
	switch -- $direction {
		"n" {
			if {[incr Y -1] < 0    } {set Y $maxY}
			set D "s"
		}
		"ne" {
			if {[incr Y -1] < 0    } {set Y $maxY}
			if {[incr X]    > $maxX} {set X 0    }
			set D "sw"
		}
		"e" {
			if {[incr X]    > $maxX} {set X 0    }
			set D "w"
		}
		"se" {
			if {[incr X]    > $maxX} {set X 0    }
			if {[incr Y]    > $maxY} {set Y 0    }
			set D "nw"
		}
		"s" {
			if {[incr Y]    > $maxY} {set Y 0    }
			set D "n"
		}
		"sw" {
			if {[incr Y]    > $maxY} {set Y 0    }
			if {[incr X -1] < 0    } {set X $maxX}
			set D "ne"
		}
		"w" {
			if {[incr X -1] < 0    } {set X $maxX}
			set D "e"
		}
		"nw" {
			if {[incr X -1] < 0    } {set X $maxX}
			if {[incr Y -1] < 0    } {set Y $maxY}
			set D "se"
		}
	}

	return [list $X $Y $D]
}

proc tile_location {x y} {
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	# apply scroll
	set column [expr {($x-$scrollx)%($maxX+1)}]
	set row [expr {($y-$scrolly)%($maxY+1)}]

	set xLocationList [::grid::get column_locations $column]
	set yLocationList [::grid::get row_locations $row]

	return [list $xLocationList $yLocationList]
}

proc tile_at {pixelx pixely} {
	set size [::grid::get size]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]
	set tile_pixels [::grid::get tile_pixels]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	# apply offsets first
	set pixelx [expr {$pixelx-$offsetx}]
	set pixely [expr {$pixely-$offsety}]

	# check we are inside the grid
	if {$pixelx<0 || $pixelx>$xPixels || $pixely<0 || $pixely>$yPixels} {return {}}

	# identify the column, row
	set cell_size [expr {$tile_pixels*(1 + 1/$::Q2)}]
	set column [expr {int(floor($pixelx/$cell_size))}]
	set row    [expr {int(floor($pixely/$cell_size))}]

	set column_pixel [expr {$column*$cell_size}]
	set row_pixel    [expr {$row*$cell_size}]

	# how far away from the top left corner of this square is our point
	set pixelx [expr {$pixelx-$column_pixel}]
	set pixely [expr {$pixely-$row_pixel}]

	set x $column
	set y $row

	# check first whether this is an area containing a square or not
	# scroll needs to be taken into account
	if {($column+$scrollx+$row+$scrolly)%2==0} {
		# cell almost entirely filled by one octagon
		# top left corner is another octagon
		if {($pixelx+$pixely)<($tile_pixels/$::Q2)} {
			incr x -1
			incr y -1
		}
	} else {
		# cell contains a square in the bottom right,
		# one octagon on the left, another at the top
		if {$pixelx>($tile_pixels/$::Q2) && $pixely>($tile_pixels/$::Q2)} {
			# the square
		} elseif {$pixelx>$pixely} {
			# octagon at the top
			incr y -1
		} else {
			# octagon on the left
			incr x -1
		}
	}

	# apply scroll
	set x [expr {($x+$scrollx)%($size*2)}]
	set y [expr {($y+$scrolly)%($size*2)}]

	return [list $x $y]
}

proc scroll_column_locations {original_column scroll_column} {
	return [::grid::get column_locations $scroll_column]
}

proc scroll_row_locations {original_row scroll_row} {
	return [::grid::get row_locations $scroll_row]
}

# redraw a column
proc redraw_column {column} {
	set maxY [::grid::get max_y]

	set x $column
	for {set y 0} {$y<=$maxY} {incr y} {
		::tiling::draw_tile $x $y
	}
}

# local procedure to make the loop easier to follow
proc redraw_row {row} {
	set maxX [::grid::get max_x]

	set y $row
	for {set x 0} {$x<=$maxX} {incr x} {
		::tiling::draw_tile $x $y
	}
}

}

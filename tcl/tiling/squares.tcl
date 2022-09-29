
namespace eval ::squares {

proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX $size
	set maxY $size
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	if {$xPixels<$yPixels} {
		set pixels $xPixels
	} else {
		set pixels $yPixels
	}
	set tile_pixels [expr {$pixels/($size+1)}]
	::grid::set tile_pixels $tile_pixels
	::grid::set xPixels $pixels
	::grid::set yPixels $pixels

	# diameter of the largest circle that will fit inside a square
	set diameter $tile_pixels
	::grid::set node_diameter [expr {$diameter - 5}]
	::grid::set path_width [expr {max($diameter/8,1)}]

	for {set column 0} {$column<=$maxX} {incr column} {
		::grid::set column_locations $column [column_locations $column]
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row [row_locations $row]
	}
	::square::new_grid
}

proc xPixels {yPixels size} {return $yPixels}
proc yPixels {xPixels size} {return $xPixels}

proc column_locations {column} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]
	set continuous [::grid::get continuous_x]

	set column_location [expr {$column*$tile_pixels + $tile_pixels/2}]

	if {$continuous && ($column_location - $xPixels + $tile_pixels/2) > (0-$padLeft)} {
		lappend locations [expr {($column_location - $xPixels)+$offsetx}]
	}

	lappend locations [expr {$column_location+$offsetx}]

	if {$continuous && ($column_location + $xPixels - $tile_pixels/2) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_location + $xPixels)+$offsetx}]
	}

	return $locations
}

proc row_locations {row} {
	set tile_pixels [::grid::get tile_pixels]
	set yPixels [::grid::get yPixels]
	set padTop [::grid::get pad_top]
	set padBottom [::grid::get pad_bottom]
	set offsety [::grid::get offsety]
	set continuous [::grid::get continuous_y]

	set row_location [expr {$row*$tile_pixels + $tile_pixels/2}]

	if {$continuous && ($row_location - $yPixels + $tile_pixels/2) > (0-$padTop)} {
		lappend locations [expr {($row_location - $yPixels)+$offsety}]
	}

	lappend locations [expr {$row_location+$offsety}]

	if {$continuous && ($row_location + $yPixels - $tile_pixels/2) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_location + $yPixels)+$offsety}]
	}

	return $locations
}

proc continuous_x {} {return ""}
proc continuous_y {} {return ""}
proc filters {} {return ""}
proc prisms {} {return 0}

proc tiles {size} {
	return [expr {($size+1)**2}]
}

proc faces {} {
	return 4.0
}

proc complexity {} {
	return 3.0
}

}

namespace eval ::squares::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	return "square"
}

proc orientation {x y} {
	return "straight"
}

proc tiles {} {
	return [::squares::tiles [::grid::get size]]
}

proc faces {} {
	return [::squares::faces]
}

proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	set continuousX [::grid::get continuous_x]
	set continuousY [::grid::get continuous_y]

	set X $x
	set Y $y
	switch -- $direction {
		"n" {
			set D "s"
			if {[incr Y -1]<0} {
				if {!$continuousY} { return {} }
				set Y $maxY 
			}
		}
		"e" {
			set D "w"
			if {[incr X]>$maxX} {
				if {!$continuousX} { return {} }
				set X 0
			}
		}
		"s" {
			set D "n"
			if {[incr Y]>$maxY} {
				if {!$continuousY} { return {} }
				set Y 0
			}
		}
		"w" {
			set D "e"
			if {[incr X -1]<0} {
				if {!$continuousX} { return {} }
				set X $maxY
			}
		}
	}

	return [list $X $Y $D]
}

proc tile_location {x y} {
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set column [expr {($x-$scrollx)%($maxX+1)}]
	set row [expr {($y-$scrolly)%($maxY+1)}]

	set xLocationList [::grid::get column_locations $column]
	set yLocationList [::grid::get row_locations $row]

	return [list $xLocationList $yLocationList]
}

proc tile_at {pixelx pixely} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
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
	if {$pixelx<0 || $pixelx>$xPixels || $pixely<0 || $pixely>$yPixels} {return {}}

	set x [expr {int(($maxX+1)*$pixelx/$xPixels + $scrollx)%($maxX+1)}]
	set y [expr {int((($maxY+1)*$pixely)/$yPixels + $scrolly)%($maxY+1)}]
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
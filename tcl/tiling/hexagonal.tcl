
namespace eval ::hexagonal {

proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX [expr {4*$size-1}]
	set maxY [expr {2*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# the tile size will be restricted by either the width or the height
	if {[xPixels $yPixels $size]<$xPixels} {
		# tile size is restricted by the screen height
		set xPixels [xPixels $yPixels $size]
		set tile_pixels [expr {2*$yPixels/(6*$size+1)}]
	} else {
		set yPixels [yPixels $xPixels $size]
		set tile_pixels [expr {2*$xPixels/($::Q3*(4*$size+1))}]
	}
	::grid::set xPixels $xPixels
	::grid::set yPixels $yPixels
	::grid::set tile_pixels $tile_pixels

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {round($tile_pixels*$::Q3)}]
	::grid::set node_diameter [expr {$diameter - 10}]
	::grid::set path_width [expr {max($diameter/10,1)}]

	for {set column 0} {$column<=$maxX} {incr column} {
		::grid::set column_locations $column [column_locations $column]
	}

	for {set row 0} {$row<=$maxY} {incr row} {
		::grid::set row_locations $row [row_locations $row]
	}

	::hexagon::new_grid
}

proc xPixels {yPixels size} {return [expr {$::Q3*$yPixels*(4*$size+1)/(6*$size+1)}]}
proc yPixels {xPixels size} {return [expr {$xPixels*(6*$size+1)/($::Q3*(4*$size+1))}]}

proc column_locations {column} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]

	set column_location [expr {$::Q3*$tile_pixels*($column+1)/2}]

	if {($column_location - $xPixels + $::Q3*$tile_pixels) > (0-$padLeft)} {
		lappend locations [expr {($column_location - $xPixels + $::Q3*$tile_pixels/2)+$offsetx}]
	}

	lappend locations [expr {$column_location+$offsetx}]

	if {($column_location + $xPixels - $::Q3*$tile_pixels) < ($xPixels + $padRight)} {
		lappend locations [expr {($column_location + $xPixels - $::Q3*$tile_pixels/2)+$offsetx}]
	}

	return $locations
}

proc row_locations {row} {
	set tile_pixels [::grid::get tile_pixels]
	set yPixels [::grid::get yPixels]
	set padTop [::grid::get pad_top]
	set padBottom [::grid::get pad_bottom]
	set offsety [::grid::get offsety]

	set row_location [expr {$tile_pixels*(3*$row+2)/2}]

	if {($row_location - $yPixels + 3*$tile_pixels/2) > (0-$padTop)} {
		lappend locations [expr {($row_location - $yPixels + $tile_pixels/2)+$offsety}]
	}

	lappend locations [expr {$row_location+$offsety}]

	if {($row_location + $yPixels - 3*$tile_pixels/2) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_location + $yPixels - $tile_pixels/2)+$offsety}]
	}

	return $locations
}

proc continuous_x {} {return 1}
proc continuous_y {} {return 1}
proc filters {} {return ""}
proc prisms {} {return ""}

proc complexity {} {
	return 5.0
}

proc tiles {size} {
	return [expr {4*$size**2}]
}

proc faces {} {
	return 6.0
}

}

namespace eval ::hexagonal::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	return "hexagon"
}

proc orientation {x y} {
	return "standing"
}

proc tiles {} {
	return [::hexagonal::tiles [::grid::get size]]
}

proc faces {} {
	return [::hexagonal::faces]
}

# assumes wrap is always enabled
proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	set X $x
	set Y $y
	switch -- $direction {
		"nne" {
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y -1]<0} {set Y $maxY}
			set D "ssw"
		}
		"e" {
			if {[incr X 2]>$maxX} {set X [expr {$X%($maxX+1)}]}
			set D "w"
		}
		"sse" {
			if {[incr X]>$maxX} {set X 0}
			if {[incr Y]>$maxY} {set Y 0}
			set D "nnw"
		}
		"ssw" {
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y]>$maxY} {set Y 0}
			set D "nne"
		}
		"w" {
			if {[incr X -2]<0} {set X [expr {$X%($maxX+1)}]}
			set D "e"
		}
		"nnw" {
			if {[incr X -1]<0} {set X $maxX}
			if {[incr Y -1]<0} {set Y $maxY}
			set D "sse"
		}
	}

	return [list $X $Y $D]
}

proc random_tile {} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	while 1 {
		set x [expr {int(rand()*($maxX+1))}]
		set y [expr {2*int(rand()*($maxY+1)/2) + ($x%2)}]
		break
	}
	
	return [list $x $y]
}

# perform the given action for every tile on the grid
# xname and yname are the names of local variables in the caller's context
# xname and yname will be populated with the x and y of the current tile
# behaves just like a for loop
proc each_tile {xname yname action} {
	upvar $xname x
	upvar $yname y

	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	for {set x 0} {$x<=$maxX} {incr x} {
		set init [expr {$x%2==0} ? {0} : {1}]

		for {set y $init} {$y<=$maxY} {incr y 2} {
			# evaluate the action
			::set code [catch { uplevel 1 $action } msg]
			switch -- $code {
				0 { }
				1 { return -code error \
							-errorinfo $::errorInfo \
							-errorcode $::errorCode $msg }
				2 { return -code return $msg }
				3 { return {} }
				4 { }
				default { return -code $code $msg }
			}
		}
	}
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
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]

	# apply offsets first
	set pixelx [expr {$pixelx-$offsetx}]
	set pixely [expr {$pixely-$offsety}]

	# check we are inside the grid
	if {$pixely<0 || $pixely>$yPixels} {return {}}
	if {$pixelx<0 || $pixelx>$xPixels} {return {}}

	# to find out which hexagon the pixel is in, we need to take three measurements
	# first is just the x location (tx)
	# second is how far in from the top left corner, along the line given by y = x/sqrt(3) (ty)
	# third is the reverse, i.e how far in from the top right corner along the line given by y = (width-x)/sqrt(3) (tz)
	# this will narrow the location down to a triangle. Each hexagon in the grid is made of 6 such triangles
	set triangle_x [expr {int(floor(2*$pixelx/($::Q3*$tile_pixels) + $scrollx))}]
	set triangle_y [expr {int(floor(($pixelx + $::Q3*$pixely)/($::Q3*$tile_pixels) + 0.5*$scrollx + 1.5*$scrolly - 0.5))}]
	set triangle_z [expr {int(floor(($xPixels - $pixelx + $::Q3*$pixely)/($::Q3*$tile_pixels) - 0.5*$scrollx + 1.5*$scrolly))}]

	# logToFile "triangle @ $triangle_x,$triangle_y,$triangle_z"

	set x $triangle_x
	set y [expr {($triangle_y + $triangle_z - 2*$size)/3}]
	if {$x%2 != $y%2} { incr x -1 }

	set x [expr {$x%($maxX+1)}]
	set y [expr {$y%($maxY+1)}]

	# ...
	logToFile "Tile @ $x,$y"

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
		if {$x%2==$y%2} {
			::tiling::draw_tile $x $y
		}
	}
}

# local procedure to make the loop easier to follow
proc redraw_row {row} {
	set maxX [::grid::get max_x]

	set y $row
	for {set x 0} {$x<=$maxX} {incr x} {
		if {$x%2==$y%2} {
			::tiling::draw_tile $x $y
		}
	}
}

}
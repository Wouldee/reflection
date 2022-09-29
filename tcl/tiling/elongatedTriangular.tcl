
namespace eval ::elongatedTriangular {

# called when a game is started
# calculate various constants, store them in the grid
# source the necessary tile shape(s)
proc new_grid {} {
	set size [::grid::get size]
	set offsetx [::grid::get offsetx]
	set offsety [::grid::get offsety]
	set xPixels [::grid::get xPixels]
	set yPixels [::grid::get yPixels]

	set maxX [expr {4*$size-1}]
	set maxY [expr {6*$size-1}]
	::grid::set max_x $maxX
	::grid::set max_y $maxY

	# the tile size will be restricted by either the width or the height
	if {[xPixels $yPixels $size] < $xPixels} {
		# tile size is restricted by the screen height
		set xPixels [xPixels $yPixels $size]
		set tile_pixels [expr {2*$yPixels/(6*$size+1)}]
	} else {
		set yPixels [yPixels $xPixels $size]
		set tile_pixels [expr {$xPixels/($size*($::Q3+2))}]
	}

	::grid::set xPixels $xPixels
	::grid::set yPixels $yPixels
	::grid::set tile_pixels $tile_pixels

	for {set column 0} {$column<$size*4} {incr column} {
		::grid::set column_locations $column "square"   "straight" [column_locations $column square straight]
		::grid::set column_locations $column "triangle" "e"        [column_locations $column triangle e]
		::grid::set column_locations $column "triangle" "w"        [column_locations $column triangle w]
	}

	for {set row 0} {$row<$size*6} {incr row} {
		::grid::set row_locations $row [row_locations $row]
	}

	# diameter of the largest circle that will fit inside a triangle
	set diameter [expr {$tile_pixels/$::Q3}]
	::grid::set node_diameter [expr {round(9*$diameter/10)}]
	::grid::set path_width [expr {max(round($diameter/5),1)}]

	::triangle::new_grid
	::square::new_grid
}

proc xPixels {yPixels size} {return [expr {2*$yPixels*$size*($::Q3+2)/(6*$size+1)}]}
proc yPixels {xPixels size} {return [expr {$xPixels*(6*$size+1)/(2*$size*($::Q3+2))}]}

proc column_locations {column shape orientation} {
	set tile_pixels [::grid::get tile_pixels]
	set xPixels [::grid::get xPixels]
	set padLeft [::grid::get pad_left]
	set padRight [::grid::get pad_right]
	set offsetx [::grid::get offsetx]
	set continuous [::grid::get continuous_x]

	set square_column_width $tile_pixels
	set triangle_column_width [expr {$::Q3*$tile_pixels/2}]	
	set column_location [expr {($column/2)*($square_column_width + $triangle_column_width)}]

	switch -- "$shape-$orientation" {
		"square-straight" {
			if {$column%2==0} {
				set column_location [expr {$column_location + $tile_pixels/2}]
			} else {
				set column_location [expr {$column_location + $triangle_column_width + $tile_pixels/2}]
			}
		}
		"triangle-e" {
			if {$column%2==0} {
				set column_location [expr {$column_location + $triangle_column_width}]
			} else {
				set column_location [expr {$column_location + $square_column_width + $triangle_column_width}]
			}
		}
		"triangle-w" {
			if {$column%2==1} {
				set column_location [expr {$column_location + $square_column_width}]
			}
		}
	}

	set locations {}

	if {$continuous && ($column_location - $xPixels + $::Q3*$tile_pixels/2) > (0-$padLeft)} {
		lappend locations [expr {($column_location - $xPixels)+$offsetx}]
	}

	lappend locations [expr {$column_location+$offsetx}]

	if {$continuous && ($column_location + $xPixels - $::Q3*$tile_pixels/2) < ($xPixels + $padRight)} {
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

	set row_location [expr {$tile_pixels*($row+1)/2}]

	if {($row_location - $yPixels + $tile_pixels) > (0-$padTop)} {
		lappend locations [expr {($row_location - $yPixels + $tile_pixels/2)+$offsety}]
	}

	lappend locations [expr {$row_location+$offsety}]

	if {($row_location + $yPixels - $tile_pixels) < ($yPixels + $padBottom)} {
		lappend locations [expr {($row_location + $yPixels - $tile_pixels/2)+$offsety}]
	}
	return $locations
}

proc continuous_x {} {return ""}
proc continuous_y {} {return 1}
proc filters {} {return ""}
proc prisms {} {return 0}

proc tiles {size} {
	return [expr {18*$size**2}]
}

proc faces {} {
	return [expr {10.0/3.0}]
}

proc complexity {} {
	return 2.4
}

}

namespace eval ::elongatedTriangular::tiling {
namespace import -force ::tiling::standard::*
namespace export *

proc shape {x y} {
	if {$x%2==0} {
		return "square"
	} else {
		return "triangle"
	}
}

proc orientation {x y} {
	if {[shape $x $y]=="square"} {
		return "straight"
	} elseif {$x%4==1} {
		if {$y%2==0} {
			return "e"
		} else {
			return "w"
		}
	} else {
		if {$y%2==0} {
			return "w"
		} else {
			return "e"
		}
	}
}

proc tiles {} {
	return [::elongatedTriangular::tiles [::grid::get size]]
}

proc faces {} {
	return [::elongatedTriangular::faces]
}

proc random_rotation {x y} {
	if {[shape $x $y]=="triangle"} {
		return [expr {int(rand()*3)}]
	} else {
		return [expr {int(rand()*4)}]
	}
}

# return a list containing the x y face of the tile facing the tile @ x,y in the given direction
proc neighbour {x y direction} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	set continuous [::grid::get continuous_x]

	set X $x
	set Y $y
	switch -- $direction {
		"n"  {
			if {[incr Y -2]<0} {set Y [expr {$Y + ($maxY+1)}]}
			set D "s" 
		}
		"nne" {
			if {[incr Y -1]<0} {set Y $maxY}
			set D "ssw"
		}
		"e"  {
			if {[incr X]>$maxX} {
				if {!$continuous} {return {}}
				set X 0
			}
			set D "w"
		}
		"sse" {
			if { [incr Y]>$maxY} {set Y 0}
			set D "nnw"
		}
		"s"  {
			if {[incr Y 2]>$maxY} {set Y [expr {$Y - ($maxY+1)}]}
			set D "n"
		}
		"ssw" {
			if {[incr Y]>$maxY} {set Y 0}
			set D "nne"
		}
		"w"  {
			if {[incr X -1]<0} {
				if {!$continuous} {return {}}
				set X $maxX
			}
			set D "e"
		}
		"nnw" {
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
		set y [expr {int(rand()*($maxY+1))}]
		if {$x%4==0 && $y%2==1} continue
		if {$x%4==2 && $y%2==0} continue
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
		set init [expr {$x%4==2} ? {1} : {0}]
		set inc  [expr {$x%2==0} ? {2} : {1}]

		for {set y $init} {$y<=$maxY} {incr y $inc} {
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
	set size [::grid::get size]
	set scrollx [::grid::get scrollx]
	set scrolly [::grid::get scrolly]

	set shape [::tile::get shape]
	set orientation [::tile::get orientation]

	# determine row, column
	set column [expr {($x - $scrollx)%($size*4)}]
	set row    [expr {($y - $scrolly)%($size*6)}]

	set xLocationList [::grid::get column_locations $column $shape $orientation]
	set yLocationList [::grid::get row_locations $row]

	return [list $xLocationList $yLocationList]
}

# return a list (x y) of the tile at the given pixelx and pixely on the canvas
proc tile_at {pixelx pixely} {
	set size [::grid::get size]
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
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
	if {$pixelx<0 || $pixelx>$xPixels} {return {}}
	if {$pixely<0 || $pixely>$yPixels} {return {}}

	set square_column_width $tile_pixels
	set triangle_column_width [expr {$::Q3*$tile_pixels/2}]

	set column [expr {2*int(floor($pixelx/($square_column_width + $triangle_column_width)))}]
	set column_pixel [expr {$column*($square_column_width + $triangle_column_width)/2}]

	if {$scrollx%2==0 && ($pixelx-$column_pixel)>$square_column_width} {
		incr column
		set column_pixel [expr {$column_pixel + $square_column_width}]
	} elseif {$scrollx%2==1 && ($pixelx-$column_pixel)>$triangle_column_width} {
		incr column
		set column_pixel [expr {$column_pixel + $triangle_column_width}]
	}

	set row [expr {int(floor(2*$pixely/$tile_pixels))}]
	set row_pixel [expr {$row*$tile_pixels/2}]

	# determine the row and column relative location
	set pixelx [expr {$pixelx - $column_pixel}]
	set pixely [expr {$pixely - $row_pixel}]

	# apply scroll to the column
	set column [expr {($column+$scrollx)%(4*$size)}]
	set row [expr {($row+$scrolly)%(6*$size)}]

	# height of the triangles
	set height $triangle_column_width

	set x $column
	set y $row

	if {$column%2==0} {
		# square
		if {($column%4==0 && $row%2==1) || ($column%4==2 && $row%2==0)} {
			incr y -1
		}
	} else {
		# triangle
		if {($column%4==1 && $row%2==0) || ($column%4==3 && $row%2==1)} {
			# w-triangle to the top-right
			if {$pixelx/$::Q3>$pixely} {
				incr y -1
			}
		} else {
			# e-triangle to the top-left
			if {$pixelx/$::Q3+$pixely<$tile_pixels/2} {
				incr y -1
			}
		}
	}

	set x [expr {$x%($maxX+1)}]
	set y [expr {$y%($maxY+1)}]

	return [list $x $y]
}

proc scroll_column_locations {original_column scroll_column} {
	# find the pixel positions of the columns for each shape and orientation
	if {$original_column%2==0} {
		return [::grid::get column_locations $scroll_column square straight]
	} else {
		set locations [::grid::get column_locations $scroll_column triangle w]
		lappend locations {*}[::grid::get column_locations $scroll_column triangle e]
		return $locations
	}
}

proc scroll_row_locations {original_row scroll_row} {
	return [::grid::get row_locations $scroll_row]
}

# redraw a column
proc redraw_column {column} {
	set maxY [::grid::get max_y]

	set x $column
	set init [expr {$x%4==2} ? {1} : {0}]
	set inc [expr {$x%2==0} ? {2} : {1}]

	for {set y $init} {$y<=$maxY} {incr y $inc} {
		::tiling::draw_tile $x $y
	}
}

# local procedure to make the loop easier to follow
proc redraw_row {row} {
	set maxX [::grid::get max_x]

	set y $row
	for {set x 0} {$x<=$maxX} {incr x} {
		if {$x%4==0 && $y%2==1} { continue }
		if {$x%4==2 && $y%2==0} { continue }
		::tiling::draw_tile $x $y
	}
}

}
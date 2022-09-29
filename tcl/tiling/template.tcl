
namespace eval ::tiling::standard {
namespace export *

# called when a tile is created @ x,y
# set any constant variables, e.g. orientation
proc new_tile {x y} {
	::tile::set shape [::tiling::shape $x $y]
	::tile::set orientation [::tiling::orientation $x $y]
}

# return a list of the faces of the tile @ x,y
proc directions {x y} {
	return [::[::tiling::shape $x $y]::directions [::tiling::orientation $x $y]]
}

# return the next clockwise face of the tile @ x,y
# face returned does not necessarily have a neighbouring face if grid is not continuous
proc next_direction {x y direction} {
	return [::[::tiling::shape $x $y]::next_direction [::tiling::orientation $x $y] $direction]
}

# return a random face of the tile @ x,y
# face returned does not necessarily have a neighbouring face if grid is not continuous
proc random_direction {x y} {
	return [::[::tiling::shape $x $y]::random_direction [::tiling::orientation $x $y]]
}

# return the face on the tile @ x,y that is $by faces clockwise from the given face
proc rotate_arm {x y arm by} {
	return [::[::tiling::shape $x $y]::rotate_arm [::tiling::orientation $x $y] $arm $by]
}

# return the connector_type of the tile if the arm is added to the link on the tile @ x,y. Empty string means the tile is not supported
proc add_arm_connector_type {x y link_id arm} {
	return [::[::tiling::shape $x $y]::add_arm_connector_type $x $y $link_id $arm]
}

# return the connector_type of the tile if the arm is removed from the link on the tile @ x,y. Empty string means the tile is not supported
proc remove_arm_connector_type {x y link_id arm} {
	return [::[::tiling::shape $x $y]::remove_arm_connector_type $x $y $link_id $arm]
}

# return the connector_type of the link is added to the tile @ x,y. Empty string means the tile is not supported
proc add_link_connector_type {x y link} {
	return [::[::tiling::shape $x $y]::add_link_connector_type $x $y $link]
}

# return the connector_type of the link is removed from the tile @ x,y. Empty string means the tile is not supported
# currently not implemented or used
proc remove_link_connector_type {x y link} { return [::[::tiling::shape $x $y]::remove_link_connector_type $x $y $link_id] }


# return the arms that would become part of a prism if the connector was turned into a prism
proc connector_to_prism {x y} {
	return [::[::tiling::shape $x $y]::connector_to_prism $x $y]
}

# return a random integer from 0 to n-1 where n is the number of faces on the tile @ x,y
proc random_rotation {x y} {
	return [expr {int(rand()*[::tiling::faces])}]
}

# return the x and y of a random tile
proc random_tile {} {
	set maxX [::grid::get max_x]
	set maxY [::grid::get max_y]
	set x [expr {int(rand()*($maxX+1))}]
	set y [expr {int(rand()*($maxY+1))}]
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
		for {set y 0} {$y<=$maxY} {incr y} {
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

# move the grid horizontally
# a positive amount indicates the grid is moving to the left
# relative to the viewer, who has pressed the right arrow key
# so the left-most tiles will reappear on the right-hand side
# a negative amount indicates the grid is moving to the right etc
proc scrollx {amount} {
	set scrollx [::grid::get scrollx]
	set increment [::grid::get scrollx_increment]
	set maxX [::grid::get max_x]
	set continuous [::grid::get continuous_x]

	if {!$continuous} {return}
	if {$amount==0} {return}

	# determine the new scroll value
	# update the scrollx in the grid with the new scroll value
	set old_scrollx $scrollx
	set new_scrollx [expr {($scrollx + $amount*$increment)%($maxX+1)}]
	::grid::set scrollx $new_scrollx
	# move each column to its new location
	for {set x 0} {$x<=$maxX} {incr x} {
		# determine the old and new scroll-relative columns
		set old_column [expr {($x-$old_scrollx)%($maxX+1)}]
		set new_column [expr {($x-$new_scrollx)%($maxX+1)}]

		# find the pixel positions of the columns for each shape and orientation
		set old_column_locations [::tiling::scroll_column_locations $x $old_column]
		set new_column_locations [::tiling::scroll_column_locations $x $new_column]

		if {[llength $old_column_locations]==[llength $new_column_locations]} {
			# if this column appears in the same number of scroll-relative columns, 
			# then calculate the distance and move the column using the canvas move command
			set old_location [lindex $old_column_locations 0]
			set new_location [lindex $new_column_locations 0]
			set movement [expr {$new_location-$old_location}]
			[screen] move "column $x" $movement 0
		} else {
			# otherwise redraw whole column
			::tiling::redraw_column $x
		}
	}
}

# move the grid vertically
# a positive amount indicates the grid is moving up
# relative to the viewer, who has pressed the down arrow key
# so the top-most tiles will reappear at the bottom
# a negative amount indicates the grid is moving down etc
proc scrolly {amount} {
	set scrolly [::grid::get scrolly]
	set increment [::grid::get scrolly_increment]
	set maxY [::grid::get max_y]
	set continuous [::grid::get continuous_y]

	if {!$continuous} {return}
	if {$amount==0} {return}

	# determine the new scroll value
	# update the scrolly in the grid with the new scroll value
	set old_scrolly $scrolly
	set new_scrolly [expr {($scrolly + $amount*$increment)%($maxY+1)}]
	::grid::set scrolly $new_scrolly

	# move each row to its new location
	for {set y 0} {$y<=$maxY} {incr y} {
		# determine the old and new scroll-relative rows
		set old_row [expr {($y-$old_scrolly)%($maxY+1)}]
		set new_row [expr {($y-$new_scrolly)%($maxY+1)}]

		# find the pixel positions of the rows
		set old_row_locations [::tiling::scroll_row_locations $y $old_row]
		set new_row_locations [::tiling::scroll_row_locations $y $new_row]

		if {[llength $old_row_locations]==[llength $new_row_locations]} {
			# if this row appears in the same number of scroll-relative rows, 
			# then calculate the distance and move the row using the canvas move command
			set old_location [lindex $old_row_locations 0]
			set new_location [lindex $new_row_locations 0]
			set movement [expr {$new_location-$old_location}]
			[screen] move "row $y" 0 $movement
		} else {
			# otherwise redraw whole row
			::tiling::redraw_row $y
		}
	}
}

# called when the tile @ x,y has first been created
# set all necessary variables on the tile
proc update_tile {x y} {
	::[::tile::get shape]::update_[::tile::get type] $x $y
}

# called when the tile has been finished, no more editing after this
# add any extra arms etc.
proc finalise_tile {x y} {
	::[::tile::get shape]::update_[::tile::get type] $x $y
	::[::tile::get shape]::finalise_[::tile::get type] $x $y
}

# draw tile on screen, recreate all canvas items
# used when displaying tile for first time, or after rotating a tile
proc draw_tile {x y} {
	if {![::tile::get complete]} return

	# delete any items/links currently displayed...
	foreach item [::tile::get bg_items] { [screen] delete $item }
	foreach item [::tile::get link_items] { [screen] delete $item }
	foreach item [::tile::get fg_items] { [screen] delete $item }

	::tile::set bg_items {}
	::tile::set fg_items {}
	::tile::set link_items {}

	lassign [::tiling::tile_location $x $y] xPixelList yPixelList
	foreach pixelx $xPixelList {
		foreach pixely $yPixelList {
			if {$::outlines} { ::[::tile::get shape]::draw_outline $x $y $pixelx $pixely }
			::[::tile::get shape]::draw_[::tile::get type] $x $y $pixelx $pixely
			::[::tile::get shape]::draw_links $x $y $pixelx $pixely
		}
	}

	set bg_tags   [list "game" "column $x" "row $y" "$x $y bg_items"]
	set link_tags [list "game" "column $x" "row $y" "$x $y link_items"]
	set fg_tags   [list "game" "column $x" "row $y" "$x $y fg_items"]

	foreach bg_item   [::tile::get bg_items]   {[screen] itemconfigure $bg_item   -tags $bg_tags}
	foreach link_item [::tile::get link_items] {[screen] itemconfigure $link_item -tags $link_tags}
	foreach fg_item   [::tile::get fg_items]   {[screen] itemconfigure $fg_item   -tags $fg_tags}

	catch { [screen] raise "$x $y link_items" "$x $y bg_items" }
	catch { [screen] raise "$x $y fg_items" "$x $y link_items" }
}

# recreate the canvas link items for a tile, raise any fg items
# used after the paths for a tile are changed
proc redraw_links {x y} {
	if {![::tile::get complete]} return

	# delete any link items/links currently displayed
	foreach item [::tile::get link_items] { [screen] delete $item }
	::tile::set link_items {}

	set tags {}
	lappend tags "column $x" "row $y"

	lassign [::tiling::tile_location $x $y] xPixelList yPixelList
	foreach pixelx $xPixelList {
		foreach pixely $yPixelList {
			::[::tile::get shape]::draw_links $x $y $pixelx $pixely
		}
	}

	set link_tags [list "game" "column $x" "row $y" "$x $y link_items"]
	foreach link_item [::tile::get link_items] {[screen] itemconfigure $link_item -tags $link_tags}
	catch { [screen] raise "$x $y link_items" "$x $y bg_items" }
	catch { [screen] raise "$x $y fg_items" "$x $y link_items" }
}

}
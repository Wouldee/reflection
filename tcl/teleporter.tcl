
namespace eval ::teleporter {

proc link {from to direction teleporterID} {
	lassign $from x y
	lassign $to to_x to_y

	set link {}
	lappend link $direction
	lappend link $teleporterID
	set link_id [::tile::new_link $link]
	::tile::set_neighbour $teleporterID [list $to_x $to_y $teleporterID]

	return $link_id
}

proc add_paths_in {x y direction paths_in} {
	logToFile "Adding arm from $direction to teleporter @ $x,$y\n[::tile::dump]" 3

	# check if there are any free faces for the paths to exit
	# incoming paths link to one or more teleporters, and exit those teleporters in the opposite direction
	# so long as one of the connecting teleporters connects to a tile that we can add an arm to, the path will be added

	# first check that we are not creating a loop in the paths by reusing a teleporter
	# assemble the paths out
	set exits {}
	array set all_paths_out {}
	foreach link_id [::tile::link_ids $direction] {
		set all_paths_out($link_id) {}
		foreach arm [::tile::link $link_id] {
			# don't go out the way we came in
			if {$arm==$direction} { continue }
			set teleporter_id $arm

			# check the connecting teleporter and also the connecting tile
			lassign [::tile::neighbour $teleporter_id] connecting_x connecting_y connecting_teleporter_id

			foreach path_source [dict keys $paths_in] {
				foreach path [dict get $paths_in $path_source] {
					# find all instances of the connecting teleporter in the path
					set tiles [lsearch -inline -all -index 1 [lsearch -inline -all -index 0 $path $connecting_x] $connecting_y]
					foreach tile $tiles {
						set connecting_link_id [lindex $tile end]
						# this path already passes through the connecting teleporter
						# check if it is in the same direction
						if {[same_direction $connecting_x $connecting_y $connecting_teleporter_id $connecting_link_id]} {
							logToFile "Path already passes through teleporter in this direction @ $x,$y:\n$path"
							return {}
						}
					}
				}
				lappend path [list $x $y $link_id]
				dict lappend all_paths_out($link_id) $path_source $path
			}
			lappend exits [list $teleporter_id $link_id]
		}
	}

	# now attempt to actually push the paths through to the connecting teleporters
	set tiles {}
	foreach exit $exits {
		lassign $exit teleporter_id link_id

		# get the neighbouring teleporter tile
		lassign [::tile::neighbour $teleporter_id] X Y D

		# the paths out
		set paths_out $all_paths_out($link_id)

		# attempt to add the path out of the connecting teleporter
		set tiles_added [add_paths_out $X $Y $D $paths_out]
		if { $tiles_added=={} } { continue }
		lappend tiles {*}$tiles_added

		# clear the paths_out from the array
		array unset all_paths_out($link_id)

		# update the paths on this link
		::tile::set_paths $link_id in $direction $paths_in
		::tile::set_paths $link_id out $teleporter_id $paths_out

		logToFile "Added arm from $direction -> $teleporter_id to teleporter @ $x,$y\n[::tile::dump]" 2
	}

	# check if any paths passed through, if so add the paths anyway to the links and connecting teleporters where
	# the paths could not pass through
	if {$tiles!={}} {
		logToFile "Added paths to teleporter"
		foreach {link_id paths_out} [array get all_paths_out] {
			set i [lsearch -index 1 $exits $link_id]
			set teleporter_id [lindex [lindex $exits $i] 0]

			::tile::set_paths $link_id in $direction $paths_in
			::tile::set_paths $link_id out $teleporter_id $paths_out

			lassign [::tile::neighbour $teleporter_id] X Y D

			add_paths $X $Y $D $paths_out
		}
	} else {
		logToFile "No paths added" 3
	}


	return $tiles
}

# return true if the teleporter and the link are both connected to the same direction
proc same_direction {x y teleporter_id link_id} {
	# find the direction of the teleporter id
	foreach arm [::tile::link [lindex [::tile::link_ids $teleporter_id] 0]] {
		if {$arm!=$teleporter_id} { break }
	}
	set direction $arm

	# is the link one of the links in the same direction
	foreach arm [::tile::link $link_id] {
		if {$arm==$direction} { return 1 }
	}
	return 0
}

# add the paths through this teleporter from a connecting teleporter, to the neighbouring tile
# return the list of new tiles added
# if the path is added successfully, update the paths on the teleporter tile
proc add_paths_out {x y teleporter_id paths_in} {
	logToFile "Adding paths out through $teleporter_id on teleporter @ $x,$y:\n[::tile::dump]" 3

	# get the link
	set link_id [lindex [::tile::link_ids $teleporter_id] 0]
	set link [::tile::link $link_id]

	# exit direction
	foreach arm $link {	if {$arm!=$teleporter_id} { break }	}
	set exit_direction $arm

	# neighbour
	lassign [::tile::neighbour $exit_direction] X Y D

	# check for a loop in the paths
	# also assemble the paths_out
	set paths_out {}
	foreach path_source [dict keys $paths_in] {
		foreach path [dict get $paths_in $path_source] {
			set tiles [lsearch -inline -all -index 1 [lsearch -inline -all -index 0 $path $X] $Y]
			if {$tiles!={}} {return {}}

			lappend path [list $x $y $link_id]
			dict lappend paths_out $path_source $path
		}
	}

	# add the arm to the neighbour
	set tiles [::generate::add_arm $X $Y $D $paths_out]
	if {$tiles=={}} {return {}}

	::tile::set_paths $link_id in $teleporter_id $paths_in
	::tile::set_paths $link_id out $exit_direction $paths_out

	logToFile "Added paths to teleporter @ $x $y:\n[::tile::dump]" 3

	return $tiles
}

# simply updates the paths on the teleporter tile
# does not propagate the paths to the neighbouring tile
proc add_paths {x y teleporter_id paths_in} {
	set link_id [lindex [::tile::link_ids $teleporter_id] 0]
	set link [::tile::link $link_id]

	foreach arm $link {	if {$arm!=$teleporter_id} { break }	}
	set exit_direction $arm

	set paths_out {}
	foreach path_source [dict keys $paths_in] {
		foreach path [dict get $paths_in $path_source] {
			lappend path [list $x $y $link_id]
			dict lappend paths_out $path_source $path
		}
	}

	::tile::set_paths $link_id in $teleporter_id $paths_in
	::tile::set_paths $link_id out $exit_direction $paths_out
}

# check each neighbour and add the paths where possible
# return true if any paths were affected
proc propagate_paths_from {x y} {
	logToFile "propogating teleporter paths from tile @ $x,$y\n[::tile::dump]" 3

	set paths_affected 0

	# each direction
	foreach direction [::tiling::directions $x $y] {
		# get the paths out
		set paths_out [::paths::from $x $y $direction]

		# check the neighbour
		set neighbour [::tile::neighbour $direction]
		if {$neighbour=={}} { continue }

		# find the colours going out
		set colour_list {}
		foreach path_source [dict keys $paths_out] {
			lassign $path_source X Y
			lappend colour_list [::tile::tile_colour $X $Y]
		}
		set colour_list [lsort -unique $colour_list]

		if { [propagate_paths_to {*}$neighbour $paths_out $colour_list] } {
			set paths_affected 1
		}

		# now get any paths coming from the neighbouring tile, add them to this one
		set paths_in [::paths::from {*}$neighbour]
		if { [paths::add $x $y $direction $paths_in] } {
			set paths_affected 1
		}
	}

	return $paths_affected
}

# return true if any paths were added
proc propagate_paths_to {x y direction paths_in colours_in} {
	logToFile "propogating teleporter paths to tile @ $x,$y\n[::tile::dump]" 3
	# check if this tile has a link in this direction
	# if so, then check the existing paths coming in and add any new ones
	set link_ids [::tile::link_ids $direction]
	if {$link_ids!={}} {
		return [::paths::add $x $y $direction $paths_in]
	}

	# otherwise attempt to add an arm to a link (i.e. mix)
	if {$paths_in!={}} {
		if {[::paths::mix_to $x $y $direction $paths_in $colours_in "teleporter"]} { return 1 }
	}

	# couldn't add a mix (or there aren't any paths to add)
	# check if the tile is a node and if so add an arm
	# it will be added when the node is finalised anyway
	switch -- [::tile::get type] {
		"teleporter" -
		"source" -
		"connector" { # nothing }
		"node" {
			set link [list $direction]
			set link_id [::tile::new_link $link]
			if {$paths_in!={}} { 
				::tile::set_paths $link_id in $direction $paths_in
				return 1
			} 
		}
	}

	return 0
}

}
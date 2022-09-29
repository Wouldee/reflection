
namespace eval ::filter {

proc add_filter {x y filtered_paths_name} {
	if {[::tile::get type]!="connector"} {return 0}
	if {[::tile::get connector_type]!="straight"} {return 0}

	upvar $filtered_paths_name filtered_paths
	
	# check only one path is used
	set used_paths 0
	::tile::each_link {
		if { [::tile::paths_exist $link_id] } {
			incr used_paths
			set used_link_id $link_id
		}
	}
	if {$used_paths!=1} {return 0}

	# check that the colour of the link is a composite, that is, check that a filter
	# would actually serve a purpose
	set colours [::tile::link_colours $used_link_id]
	if {[llength $colours]<=1} {return 0}

	# now check that we are not fucking up some previously added filter
	# without this check you end up with "black" nodes (they are only lit when there is no colour) which are kind of interesting
	# but don't really add to the difficulty of the puzzle
	set link [::tile::link $used_link_id]
	foreach arm $link {
		if {![::tile::paths_exist $used_link_id in $arm]} continue
		set paths_in [::tile::paths $used_link_id in $arm]
		# check each source coming into this link
		foreach path_source [dict keys $paths_in] {
			# see if any previously filtered path from the source passes through this tile
			if {![dict exists $filtered_paths $path_source]} continue
			foreach path [dict get $paths_in $path_source] {
				set length [llength $path]
				foreach filtered_path [dict get $filtered_paths $path_source] {
					if {[llength $filtered_path]<$length} continue
					if {[lrange $filtered_path 0 $length-1]==$path} {
						# note that it could still be ok to add a filter to this tile
						# if the tile that the filtered path leads to is still a composite colour
						# then it would be possible to add a filter of a different colour to this tile
						# but this would be difficult to implement and we are already indented enough at this point so fuck it
						return 0
					}
				}
			}
		}
	}
	
	# ok now remove all the other links
	::tile::each_link {
		if {![::tile::paths_exist $link_id]} {
			::tile::delete_link $link_id
		}
	}

	# delete the connector type
	::tile::unset connector_type
	::tile::set type "filter"

	# choose a random colour for our filter
	set filter_colour [lindex $colours [expr {int(rand()*[llength $colours])}]]
	::tile::link_filter $used_link_id $filter_colour

	# complete the tile
	::generate::update_tile $x $y

	# now update the paths
	set link [::tile::link $used_link_id]
	foreach arm $link {
		# check each path going out of this arm
		if {[::tile::paths_exist $used_link_id out $arm]} {
			set paths_out [::tile::paths $used_link_id out $arm]

			# assemble a dict of all paths that do not match the filter colour
			set remove_paths {}
			foreach path_source [dict keys $paths_out] {
				lassign $path_source X Y D
				if {[::tile::tile_colour $X $Y]!=$filter_colour} {
					# remove the path from this tile
					::tile::delete_paths $used_link_id out $arm $path_source
					# add the path to the list
					dict set remove_paths $path_source [dict get $paths_out $path_source]
				}
			}

			# remove the paths going into the neighbour
			if {[set neighbour [::tile::neighbour $arm]]!={}} {
				lassign $neighbour X Y D
				if {$remove_paths!={}} { paths::remove $X $Y $D $remove_paths }
			}
		}
		
		# finally update the dict of filtered paths
		if {[::tile::paths_exist $used_link_id in $arm]} {
			set paths_in [::tile::paths $used_link_id in $arm]
			foreach path_source [dict keys $paths_in] {
				foreach path [dict get $paths_in $path_source] {
					dict lappend filtered_paths $path_source $path
				}
			}
		}
	}

	return 1
}

proc add_prism {x y filtered_paths_name} {
	#return 0
	if {[::tile::get type]!="connector"} {return 0}

	set prism_face [::tiling::connector_to_prism $x $y]
	if {$prism_face=={}} {return 0}

	upvar $filtered_paths_name filtered_paths

	# check that we are not fucking up some previously added filter/prism
	# without this check you end up with "black" nodes (they are only lit when there is no colour) which are kind of interesting
	# but don't really add to the difficulty of the puzzle
	# also check that the colours currently coming in each arm will match the colours allowed in each arm
	# one face of the prism will not be filtered, this is the white face.
	set left_prism_ok 1
	set right_prism_ok 1
	set existing_link_ids {}
	set all_colours_in {}

	logToFile "attempt to add prism @ $x,$y" 4

	foreach arm [dict keys $prism_face] {
		# existing link_id of this arm
		set link_id [lindex [::tile::link_ids $arm] 0]
		lappend existing_link_ids $link_id

		# no paths coming in here - ok
		if {![::tile::paths_exist $link_id in $arm]} continue

		# colours currently coming in this arm
		set colours_in {}

		set paths_in [::tile::paths $link_id in $arm]
		# check each source coming into this link
		foreach path_source [dict keys $paths_in] {
			lassign $path_source X Y
			lappend colours_in [::tile::tile_colour $X $Y]

			# see if any previously filtered path from the source passes through this tile
			if {![dict exists $filtered_paths $path_source]} continue

			logToFile "attempting to add prism @ $x,$y"
			logToFile "path from source @ $X,$Y already filtered"

			foreach path [dict get $paths_in $path_source] {
				set length [llength $path]
				foreach filtered_path [dict get $filtered_paths $path_source] {
					if {[llength $filtered_path]<$length} continue
					if {[lrange $filtered_path 0 $length-1]==$path} {
						# so a path coming into this arm is filtered after it leaves the prism
						# can't add a prism
						logToFile "path already filtered, [expr {[llength $filtered_path] - $length}] tiles downstream"
						return 0

						# # make sure any prism we add would not also filter the paths leaving this arm
						# if {$left_prism_ok && [llength [dict get $prism_face $arm "left" colours]]!=3} {
							# logToFile "left prism not OK because path to the $arm is filtered already\n[::tile::dump]" 4
							# set left_prism_ok 0
						# }
						# if {$right_prism_ok && [llength [dict get $prism_face $arm "right" colours]]!=3} {
							# logToFile "right prism not OK because path to the $arm is filtered already\n[::tile::dump]" 4
							# set right_prism_ok 0
						# }
					}
				}
			}
		}

		# see if the colours coming in this arm are not going to be filtered
		foreach colour [lsort -unique $colours_in] {
			if {$left_prism_ok && [lsearch [dict get $prism_face $arm "left" colours] $colour]<0} {
				logToFile "left prism not OK because $colour cannot enter from the $arm\n[::tile::dump]" 4
				set left_prism_ok 0
			}
			if {$right_prism_ok && [lsearch [dict get $prism_face $arm "right" colours] $colour]<0} {
				logToFile "right prism not OK because $colour cannot enter from the $arm\n[::tile::dump]" 4
				set right_prism_ok 0
			}
		}

		lappend all_colours_in {*}$colours_in
	}

	# check that the incoming colours are exactly one red, one green and one blue
	if {[llength $all_colours_in]!=3 || [llength [lsort -unique $all_colours_in]]!=3} {
		logToFile "prism not ok because not the right colours ($all_colours_in)\n[::tile::dump]" 4
		return 0
	}

	# see if we can add a prism
	if { $left_prism_ok } {
		set prism_orientation "left"
	} elseif { $right_prism_ok } {
		set prism_orientation "right"
	} else {
		return 0
	}
	logToFile "adding prism to tile @ $x,$y\n[::tile::dump]" 3

	# delete the connector type
	::tile::unset connector_type
	::tile::set type "prism"
	::tile::set prism_orientation $prism_orientation

	# now split the existing link into 3 new links

	# delete the old link(s)
	set existing_link_ids [lsort -unique -integer $existing_link_ids]
	foreach link_id $existing_link_ids {
		# remove any paths going out
		set link [::tile::link $link_id]
		foreach arm $link {
			if {![::tile::paths_exist $link_id out $arm]} { continue }
			set paths_out [::tile::paths $link_id out $arm]

			if {[set neighbour [::tile::neighbour $arm]]=={}} { continue }
			::paths::remove {*}$neighbour $paths_out
		}

		# delete the link from the tile
		::tile::delete_link $link_id
	}

	# find the main face
	foreach arm [dict keys $prism_face] {
		set arm_colours [dict get $prism_face $arm $prism_orientation colours]
		if {[llength $arm_colours]==3} { break }
	}
	set main_face $arm

	# create new links between the main face and each of the other faces it connects to
	foreach arm [dict get $prism_face $main_face $prism_orientation to] {
		set old_link_id [lindex [::tile::link_ids $arm] 0]

		# new link
		set link [list $main_face $arm]
		set new_link_id [::tile::new_link $link]

		# filter the link according to the colour of the other face
		set colour [lindex [dict get $prism_face $arm $prism_orientation colours] 0]
		::tile::link_filter $new_link_id $colour
	}

	# complete the tile
	::generate::update_tile $x $y

	# add the paths
	foreach arm [dict keys $prism_face] {
		if {[set neighbour [::tile::neighbour $arm]]=={}} { continue }
		paths::add $x $y $arm [::paths::from {*}$neighbour]

		logToFile "arm $arm: added paths from neighbour:\n[::paths::from {*}$neighbour]" 4

		# update the dict of filtered paths
		foreach link_id [::tile::link_ids $arm] {
			if {[::tile::paths_exist $link_id in $arm]} {
				set paths_in [::tile::paths $link_id in $arm]
				foreach path_source [dict keys $paths_in] {
					foreach path [dict get $paths_in $path_source] {
						dict lappend filtered_paths $path_source $path
					}
				}
			}
		}
	}

	return 1
}
}
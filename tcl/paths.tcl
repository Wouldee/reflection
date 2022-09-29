
namespace eval paths {

# find all paths going out the given direction
# based on what is coming in the other directions
proc calculate {x y link_id direction} {
	set paths_out {}

	switch -- [::tile::get type] {
	"node" {
		# nodes are dead ends that do not generate light
	}
	"teleporter" -
	"connector" {
		# each arm
		foreach arm [::tile::link $link_id] {
			# ignore the arm corresponding to the direction we're interested in
			if {$direction==$arm} continue
			# any paths coming in
			if {![::tile::paths_exist $link_id in $arm]} continue
			set paths_in [::tile::paths $link_id in $arm]
			# each source
			foreach path_source [dict keys $paths_in] {
				# each path
				foreach path [dict get $paths_in $path_source] {
					# add this link to the path
					lappend path [list $x $y $link_id]
					dict lappend paths_out $path_source $path
				}
			}
		}
	}
	"filter" - 
	"prism" {
		# link colour
		set colour [::tile::link_filter $link_id]

		# each arm
		foreach arm [::tile::link $link_id] {
			# ignore the arm corresponding to the direction we're interested in
			if {$direction==$arm} continue
			# any paths coming in
			if {![::tile::paths_exist $link_id in $arm]} continue
			set paths_in [::tile::paths $link_id in $arm]
			# each source
			foreach path_source [dict keys $paths_in] {
				# check the colour
				lassign $path_source X Y D
				if {[::tile::tile_colour $X $Y]!=$colour} continue
				# each path
				foreach path [dict get $paths_in $path_source] {
					# add this link to the path
					lappend path [list $x $y $link_id]
					dict lappend paths_out $path_source $path
				}
			}
		}
	}
	"source" {
		# sources generate paths, there is a path going out of this arm
		set path {}
		lappend path [list $x $y $link_id]
		set path_list {}
		lappend path_list $path
		dict set paths_out [list $x $y $link_id] $path_list
	}
	} ; # end switch

	return $paths_out
}

# return the paths that are coming out of the tile at <x> <y> in the <direction>
proc from {x y direction} {
	set paths_out {}

	switch -- [::tile::get type] {
	"node" {
		# nodes are dead ends that do not generate light
	}
	"teleporter" -
	"prism" {
		# may be more than one link going out this direction
		# check each link going out of this arm
		# create a combined dictionary of all paths going out of each link
		foreach link_id [::tile::link_ids $direction] {
			if {![::tile::paths_exist $link_id out $direction]} { continue }
			# paths out this link
			set link_paths_out [::tile::paths $link_id out $direction]
			foreach path_source [dict keys $link_paths_out] {
				dict lappend paths_out $path_source {*}[dict get $link_paths_out $path_source]
			}
		}
	}
	"filter" -
	"connector" -
	"source" {
		# only one link_id per arm
		set link_id [lindex [::tile::link_ids $direction] 0]

		# check for any paths from this link to the direction given
		if {$link_id!="" && [::tile::paths_exist $link_id out $direction]} {
			set paths_out [::tile::paths $link_id out $direction]
		}
	}
	} ; # end switch

	return $paths_out
}

# remove the given paths. They are coming into the tile at x,y from the given direction
proc remove {x y from {paths {}}} {
	set tile_type [::tile::get type]

	# identify the relevant links
	foreach link_id [::tile::link_ids $from] {

		# check if any paths recorded as coming in from this direction
		if {![::tile::paths_exist $link_id in $from]} { continue }
		set paths_in [::tile::paths $link_id in $from]

		# by default remove all paths coming in
		if {$paths=={}} { set paths $paths_in }

		# paths to remove recursively
		set PATHS {}
		logToFile "removing paths in from $from on tile @ $x $y\npaths to remove: $paths\n[::tile::dump]" 3

		# each path_source with paths to remove
		foreach path_source [dict keys $paths] {
			# check if this link has paths from the source
			if {![dict exists $paths_in $path_source]} continue
			set existing_paths [dict get $paths_in $path_source]

			# check if light from the source can pass through
			set passes 1
			if {($tile_type=="filter" || $tile_type=="prism") && [::tile::link_filter $link_id]!=""} {
				# check if the path colour matches the filter colour
				set filter_colour [::tile::link_filter $link_id]
				lassign $path_source X Y D
				set path_colour [::tile::tile_colour $X $Y]
				if { $path_colour != $filter_colour} {
					set passes 0
				}
			}

			# each path to remove
			foreach path [dict get $paths $path_source] {
				# check if this path is recorded
				set index [lsearch $existing_paths $path]
				if {$index<0} continue

				# remove the path from the existing paths
				set existing_paths [lreplace $existing_paths $index $index]

				if {!$passes} continue

				# add the current tile/link to the path being removed
				lappend path [list $x $y $link_id]

				# remove the path from the list of paths going out the other arms of this link
				foreach arm [::tile::link $link_id] {
					if {$arm==$from} continue
					if {![::tile::paths_exist $link_id out $arm $path_source]} { continue }

					set path_list [::tile::paths $link_id out $arm $path_source]
					set index [lsearch $path_list $path]
					set path_list [lreplace $path_list $index $index]
					# check if paths need to be removed completely
					if {$path_list=={}} {
						::tile::delete_paths $link_id out $arm $path_source
					} else {
						::tile::set_paths $link_id out $arm $path_source $path_list
					}
				}

				# add the path to the PATHS to remove recursively
				dict lappend PATHS $path_source $path
			}

			if {$existing_paths=={}} {
				dict unset paths_in $path_source
			} else {
				dict set paths_in $path_source $existing_paths
			}
		}

		if {$paths_in=={}} {
			::tile::delete_paths $link_id in $from
		} else {
			::tile::set_paths $link_id in $from $paths_in
		}

		logToFile "removed paths in from $from on tile @ $x $y\n[::tile::dump]" 2
		if {$PATHS=={}} { continue }

		# now recursively remove the paths in every other direction for this link
		foreach arm [::tile::link $link_id] {
			if {$arm==$from} { continue }
			if { [set neighbour [::tile::neighbour $arm]]=={} } continue
			lassign $neighbour X Y D
			remove $X $Y $D $PATHS
		}
	}
}

# add the given paths. They are coming into the tile at x,y from the given direction
# return true if any paths added
proc add {x y from paths} {
	# no paths to add?
	if {$paths=={}} { return 0 }
	logToFile "adding paths in from $from on tile @ $x $y\npaths: $paths\n[::tile::dump]" 3

	set tile_type [::tile::get type]

	set any_paths_added 0

	# identify the relevant links
	foreach link_id [::tile::link_ids $from] {
		#update the paths coming in
		if {[::tile::paths_exist $link_id in $from]} {
			set paths_in [::tile::paths $link_id in $from]
		} else {
			set paths_in {}
		}

		# paths for the recursive call
		set PATHS {}

		# each path_source with paths to add
		foreach path_source [dict keys $paths] {
			set existing_paths {}
			# check if this link already has paths from the source
			if {[dict exists $paths_in $path_source]} {
				set existing_paths [dict get $paths_in $path_source]
			}

			# check if light from the source can pass through
			set passes 1
			if {($tile_type=="filter" || $tile_type=="prism") && [::tile::link_filter $link_id]!=""} {
				# check if the path colour matches the filter colour
				set filter_colour [::tile::link_filter $link_id]
				lassign $path_source X Y D
				set path_colour [::tile::tile_colour $X $Y]
				if { $path_colour != $filter_colour} {
					set passes 0
				}
			}

			# each path to add
			foreach path [dict get $paths $path_source] {
				# check if this path is already recorded
				if {[lsearch $existing_paths $path]>=0} { continue }

				# check if this path already goes through this tile/link
				# if so it means the path forms a loop and it is not recorded past this point
				if {[lsearch $path [list $x $y $link_id]]>=0} { continue }

				# add the path to the existing paths
				lappend existing_paths $path
				set any_paths_added 1

				# the path comes in, but it does not continue
				if {!$passes} continue

				# add the current tile/link to the path
				lappend path [list $x $y $link_id]

				# add the path to the list of paths going out the other arms of this link
				foreach arm [::tile::link $link_id] {
					if {$arm==$from} continue

					if {[::tile::paths_exist $link_id out $arm]} {
						set paths_out [::tile::paths $link_id out $arm]
						if {[dict exists $paths_out $path_source]} {
							set path_list [dict get $paths_out $path_source]
						} else {
							set path_list {}
						}
						dict set paths_out $path_source [lappend path_list $path]
					} else {
						set paths_out {}
						dict set paths_out $path_source [list $path]
					}

					::tile::set_paths $link_id out $arm $paths_out
				}

				# add the path to the PATHS to add recursively
				dict lappend PATHS $path_source $path
			}

			if {$existing_paths!={}} {
				dict set paths_in $path_source $existing_paths
			}
		}

		if {$paths_in!={}} {
			::tile::set_paths $link_id in $from $paths_in
		}

		logToFile "added paths in from $from on tile @ $x $y\n[::tile::dump]" 2

		if {$PATHS=={}} { continue }

		# now recursively add the paths in every other direction for this link
		foreach arm [::tile::link $link_id] {
			if {$arm==$from} { continue }
			if { [set neighbour [::tile::neighbour $arm]]=={} } continue
			lassign $neighbour X Y D
			add $X $Y $D $PATHS
		}
	}

	return $any_paths_added
}

# attempt to mix the paths on this tile with a random neighbour
# a new arm will be added to each tile if successful
# otherwise nothing changes
# return 1 if the mix was successful, 0 otherwise
# tile must be either a node, connector, or source
proc mix_from {x y} {
	logToFile "mixing paths from tile @ $x $y\n[::tile::dump]" 3

	# for now, disable mixing through teleporters...
	if {[::tile::get type]=="teleporter"} { return 0 }

	while 1 {
		# check each direction
		if {![info exists initial_direction]} {
			# first time round, pick a direction to start with
			set initial_direction [::tiling::random_direction $x $y]
			set direction $initial_direction
		} else {
			# stopping condition - check if we've come around to the initial direction again
			set direction [::tiling::next_direction $x $y $direction]
			if {$direction==$initial_direction} break
		}
		logToFile "trying to mix tile $x,$y to the $direction" 3

		# check if there is already a path in this direction
		set link_ids [::tile::link_ids $direction]
		if {$link_ids!={}} {
			# there can only be one link per direction
			set link_id [lindex $link_ids 0]
			if {[::tile::paths_exist $link_id in $direction] || [::tile::paths_exist $link_id out $direction]} { continue }
		}

		# is there a neighbouring tile
		if { [set neighbour [::tile::neighbour $direction]]=={} } continue
		lassign $neighbour X Y D

		# ok see if we can add a connection from here to the neighbour
		if {[::tile::get type]=="connector"} {
			::tile::each_link {
				# get the paths going out of this arm
				set paths_out [calculate $x $y $link_id $direction]
				# no paths => no mix possible
				if {$paths_out=={}} continue

				# check if the tile is valid
				# if {![::tiling::add_arm_ok $x $y $link_id $direction]} continue
				set new_connector_type [::tiling::add_arm_connector_type $x $y $link_id $direction]
				if {$new_connector_type==""} continue

				# find the colours on this link
				set colour_list [::tile::link_colours $link_id]

				# all OK on this end, attempt to add the necessaries to the neighbour
				# if we can't then OK we haven't actually changed anything at this end 
				# so just continue
				if {![mix_to $X $Y $D $paths_out $colour_list connector]} continue
				# now the arm and paths have been added to the neighbour, do the same here

				# first of all find out if the direction was previously attached to a link
				set link_ids [::tile::link_ids $direction]
				if {$link_ids!={}} {
					# delete the old link
					set old_link_id [lindex $link_ids 0]
					::tile::delete_link $old_link_id
				}

				# add the new arm to this link
				::tile::add_arm $link_id $direction

				# set the new connector type
				::tile::set connector_type $new_connector_type

				# update the tile
				generate::update_tile $x $y

				# set the paths going out
				::tile::set_paths $link_id out $direction $paths_out

				# add the paths coming in, to this tile and any other tiles connected to here
				set paths_in [from $X $Y $D]
				add $x $y $direction $paths_in
				logToFile "mixed paths from $direction on tile @ $x $y\n[::tile::dump]" 2

				return 1
			}
		} else {
			# we will have to add a new link and arm
			set link_id [::tile::next_link_id]

			# paths out and color list
			dict set paths_out [list $x $y $link_id] [list [list [list $x $y $link_id]]]
			set colour_list [list [::tile::get colour]]

			if {![mix_to $X $Y $D $paths_out $colour_list source]} continue
			# the arm and paths have been added to the neighbour, do the same here

			# first of all find out if the direction was previously attached to a link
			set link_ids [::tile::link_ids $direction]
			if {$link_ids!={}} {
				set old_link_id [lindex $link_ids 0]
				# delete the old link
				::tile::delete_link $old_link_id
			}

			# create the link
			set link_id [::tile::new_link [list $direction]]

			# update the description
			generate::update_tile $x $y

			# set the path going out
			::tile::set_paths $link_id out $direction $paths_out

			# add the paths coming in
			set paths_in [from $X $Y $D]
			::tile::set_paths $link_id in $direction $paths_in
			logToFile "mixed paths from $direction on tile @ $x $y\n[::tile::dump]" 2

			return 1
		}
	}

	return 0
}

# attempt to mix paths with the tile at x y from the given direction
# paths_in the dict of paths (each source has a path_list)
# colours_in is the list of colours
# return true if the mix was made, 0 otherwise
# tile must be a source, connector or node
proc mix_to {x y direction paths_in colours_in from_type} {
	logToFile "mixing paths to $direction on tile @ $x $y\n[::tile::dump]" 3

	if {[::tile::get type]=="teleporter"} { return 0 }

	set link_ids [::tile::link_ids $direction]
	set existing_link_id [lindex $link_ids 0]

	# check no paths already in this direction (shouldn't be)
	if {$existing_link_id != ""} {
		if {[::tile::paths_exist $existing_link_id in $direction] || [::tile::paths_exist $existing_link_id out $direction]} {
			set existing_in [::tile::paths $existing_link_id in $direction]
			set existing_out [::tile::paths $existing_link_id out $direction]
			logToFile "attempted to mix paths to $x $y $direction with paths '$paths_in' and colours '$colours_in'" 1
			logToFile "already have paths in: '$existing_in'\nand out: $existing_out" 1
			return 0
		}
	}

	switch -- [::tile::get type] {
	"node" {
		# check colours of node against the new colours in
		if {[colour::intersection [::tile::colours] $colours_in]!={}} {return 0}

		# do we need to add a new link?
		if {$existing_link_id==""} {
			set link_id [::tile::new_link [list $direction]]
		} else {
			set link_id $existing_link_id
		}

		# add the new paths
		::tile::set_paths $link_id in $direction $paths_in
		logToFile "mixed paths to $direction on tile @ $x $y\n[::tile::dump]" 2

		return 1
	}
	"connector" {
		# check each link, for a mutually exclusive set of colours
		set mix_paths 0
		::tile::each_link {
			set colour_list [::tile::link_colours $link_id]
			if {$colour_list=={}} continue

			# check if the tile will be valid
			# if {![::tiling::add_arm_ok $x $y $link_id $direction]} continue
			set new_connector_type [::tiling::add_arm_connector_type $x $y $link_id $direction]
			if {$new_connector_type==""} continue

			if {[colour::intersection $colour_list $colours_in]=={}} {
				set mix_paths 1
				break
			}
		}
		if {!$mix_paths} {return 0}

		# first of all find out if the direction was previously attached to a link
		if {$existing_link_id!=""} {
			# delete the old link
			::tile::delete_link $existing_link_id
		}

		# add a new arm to this link
		::tile::add_arm $link_id $direction

		# new type of connector
		::tile::set connector_type $new_connector_type

		# update the description etc
		generate::update_tile $x $y

		# set the paths going out
		::tile::set_paths $link_id out $direction [calculate $x $y $link_id $direction]

		# add the paths coming in, to this tile and any other tiles connected to here
		add $x $y $direction $paths_in
		logToFile "mixed paths to $direction on tile @ $x $y\n[::tile::dump]" 2

		return 1
	}
	"source" {
		# don't connect one source to another
		if {$from_type=="source"} {return 0}

		# check if the colour of this source is in the colour list, if not then ok
		if {[lsearch $colours_in [::tile::get colour]]>=0} {return 0}

		# first of all find out if the direction was previously attached to a link
		if {$existing_link_id!=""} {
			# delete the old link
			::tile::delete_link $existing_link_id
		}

		# add a new arm & link
		# get the link_id, increase number of links
		set link_id [::tile::new_link [list $direction]]

		# update the description
		generate::update_tile $x $y

		# set te path going out
		dict set paths_out [list $x $y $link_id] [list [list [list $x $y $link_id]]]
		::tile::set_paths $link_id out $direction $paths_out

		# add the paths coming in
		::tile::set_paths $link_id in $direction $paths_in
		logToFile "mixed paths to $direction on tile @ $x $y\n[::tile::dump]" 2

		return 1
	}
	default { error "Attempting to mix a path to tile type [::tile::get type]"}
	} ; # end switch
}

} ; # end namespace
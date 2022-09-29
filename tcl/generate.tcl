
namespace eval ::generate {

proc game {args} {

	set game_args [::process_args options $args {rgb "rgb" mix 1 filters 1 sources ""}]

	set size [::grid::get size]
	set tiles [::tiling::tiles]
	set faces [::tiling::faces]

	if {$options(sources)!=""} {
		set source_count $options(sources)
	} else {
		set source_count [expr {max(isqrt($tiles),1)}]
	}
	set mix_count [expr {round($options(mix)*$faces*($source_count-1)/3)}]
	set filter_count [expr {$options(filters)*($mix_count/2)}]

	::grid::set lit 0
	::grid::set nodes 0

	::logToFile "Generating grid with $tiles tiles ($faces faces per tile for a total of [expr {$tiles*$faces}] faces): size=$size, sources=$source_count, mixes=$mix_count, filters=$filter_count" 1

	set start [clock microseconds]
	# add the required sources
	set sources [add_sources $options(rgb) $source_count]
	# the sources added will be the initial set of tiles that we build the networks from
	set tiles $sources

	# make lists of each type of node
	set connectors {}
	set nodes {}
	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to generate [llength $sources] sources" 1

	set start [clock microseconds]
	# build a network from each source until the grid is filled
	while {$tiles!={}} {
		# choose a tile at random
		set index [expr {int(rand()*[llength $tiles])}]
		lassign [lindex $tiles $index] x y

		# attempt to add an arm
		set new_tiles [add_random_arm $x $y]
		if {$new_tiles!={}} {
			# an arm was successfully added
			# add the new tiles to our list
			set tiles [lsort -unique [concat $tiles $new_tiles]]
		} else {
			# can't add any arms to this tile - complete it
			update_tile $x $y
			# remove from the list
			set tiles [lreplace $tiles $index $index]

			# add the tile to its list
			switch -- [::tile::get type] {
				"source" {}
				"connector" {lappend connectors [list $x $y]}
				"node" {lappend nodes [list $x $y]}
			}
		}
	}
	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to populate grid" 1

	# the list of of connectors may contain duplicates at this point
	# specifically this can happen when an arm is added through one or more tiles to an empty tile
	# the intermediate tiles may have been previously completed
	set connectors [lsort -unique $connectors]
	
	# make a list of all candidate tiles - mixes can be made from a source or a connector
	set mix_tiles [concat $sources $connectors]
	
	set start [clock microseconds]
	# attempt to mix some of the paths
	set mixes_added [add_mixes $mix_count $mix_tiles]
	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to add $mixes_added/$mix_count mixes" 1

	set start [clock microseconds]
	# add filtering (filters and prisms). Filtering can only be added to connectors
	set filters_added [add_filtering $filter_count $connectors]
	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to add $filters_added/$filter_count filters" 1
	
	set start [clock microseconds]
	# after mixing and filtering the colours of many of the nodes will likely be wrong
	update_node_colours $nodes
	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to update nodes" 1
	
	# at this point the puzzle is solved
	::grid::set nodes [llength $nodes]
	::grid::set lit [llength $nodes]

	set start [clock microseconds]
	# finalise the tiles
	::tiling::each_tile x y {finalise_tile $x $y}
	set duration [expr {[clock microseconds]-$start}]
	::logToFile "$duration ms to finalise tiles" 1

	logToFile "grid composed of [llength $sources] sources, [llength $connectors] connectors, [llength $nodes] nodes" 1

	# connectors includes prisms & filters
	return [list $sources $connectors $nodes]
}

# add sources at random locations to an (empty) grid
# if the grid does not contain enough empty tiles this will probably loop forever....
# return a list of {x y} sources added
proc add_sources { rgb count } {
	set sources {}

	# make sure there is at least one of each colour
	foreach c [split $rgb {}] {
		lassign [::tiling::random_tile] x y

		# check the tile is empty
		if {[::tile::exists $x $y]} { continue }

		::tile::new source [::colour::primary $c]
		lappend sources [list $x $y]
		if {[llength $sources]>=$count} { break }
	}

	# keep choosing random locations until we have added enough sources
	while {[llength $sources]<$count} {
		lassign [::tiling::random_tile] x y

		# check the tile is empty
		if {[::tile::exists $x $y]} { continue }

		# random primary colour
		::tile::new source [::colour::random_primary $rgb]
		lappend sources [list $x $y]
	}

	return $sources
}

# add an arm to the tile in a random direction
# return true if an arm was added
# return false if it was not possible to add an arm
proc add_random_arm {x y} {
	# if we add an arm successfully there will be at least one new tile
	set new_tiles {}

	logToFile "Adding arm in random direction to tile @ $x,$y\n[::tile::dump]" 3

	while 1 {
		if {![info exists initial_direction]} {
			# first time round, pick a direction to start with
			set initial_direction [::tiling::random_direction $x $y]
			set direction $initial_direction
		} else {
			# stopping condition - check if we've come around to the initial direction again
			set direction [::tiling::next_direction $x $y $direction]
			if {$direction==$initial_direction} break
		}

		logToFile "Trying to add arm to $x,$y to the $direction" 3

		# get link_ids for this direction
		set link_ids [::tile::link_ids $direction]
		# check if there is already a path in this direction
		if {$link_ids!={}} continue

		# ok find a link to add the arm to
		# if this is a source, then we add a new link
		if {[::tile::get type]=="source"} {
			# source, get next link_id
			set link_id [::tile::next_link_id]
		} else {
			# otherwise use existing link
			set add_arm_ok 0
			::tile::each_link {
				# check  if ok to add arm to this link
				#if {![::tiling::add_arm_ok $x $y $link_id $direction]} continue
				set new_connector_type [::tiling::add_arm_connector_type $x $y $link_id $direction]
				if {$new_connector_type==""} continue
				set add_arm_ok 1
				break
			}

			if {!$add_arm_ok} continue
		}

		# is there a neighbouring tile
		if { [set neighbour [::tile::neighbour $direction]]=={} } continue
		lassign $neighbour X Y D

		# find any paths going out of this arm
		set paths_out [paths::calculate $x $y $link_id $direction]

		# can we connect to the neighbour from here
		set new_tiles [add_arm $X $Y $D $paths_out]
		if {$new_tiles=={}} continue

		# if this is a source, we've added a new link
		if {[::tile::get type]=="source"} {
			set link_id [::tile::new_link {}]
		} else {
			# otherwise update the connector_type
			::tile::set connector_type $new_connector_type
		}

		# add the new arm to the link then, and return
		::tile::add_arm $link_id $direction
		::tile::set_paths $link_id out $direction $paths_out

		logToFile "Added $direction arm to tile @ $x,$y\n[::tile::dump]" 2

		break
	}

	return $new_tiles
}

# check if an arm can be added to the tile
# from the given direction
# origins are the x y values the call was instigated from, to prevent infinite loops
# return a list of the tiles added (empty list if no tiles added)
proc add_arm {x y direction paths_in} {
	
	if {![::tile::exists $x $y]} {
		# tile is blank
		::tile::new connector
		::tile::new_link [list $direction]
		::tile::set_paths 0 in $direction $paths_in
		logToFile "Added $direction arm to previously empty tile @ $x,$y\n[::tile::dump]" 2
		return [list [list $x $y]]
	}

	set type [::tile::get type]

	switch -- $type {
		"connector" {
			return [add_arm_to_connector $x $y $direction $paths_in]
		}
		"teleporter" {
			return [::teleporter::add_paths_in $x $y $direction $paths_in]
		}
		default {
			return {}
		}
	}
}

proc add_arm_to_connector {x y direction paths_in} {
	logToFile "Adding $direction arm to connector @ $x,$y\n[::tile::dump]" 3

	# check if all existing links on this tile are complete
	# also check if there are any free faces for the new link to exit
	set exit_directions [::tiling::directions $x $y]
	::tile::each_link {
		# tile is not yet complete - don't add anything
		# change break test to
		# if {[::tile::connector_type]==""}
		if {[llength $link]<2} { return {} }
		foreach arm $link {
			set i [lsearch $exit_directions $arm]
			set exit_directions [lreplace $exit_directions $i $i]
		}
	}

	# OK now check which exit direction we can use
	set tiles {}
	foreach exit_direction $exit_directions {
		# don't go out the way we came in
		if {$exit_direction==$direction} continue

		# check if there's a neighbour
		if { [set neighbour [::tile::neighbour $exit_direction]]=={} } continue
		lassign $neighbour X Y D

		# check if the resulting tile is supported
		# if {![::tiling::add_link_ok $x $y [list $direction $exit_direction]]} continue
		set new_connector_type [::tiling::add_link_connector_type $x $y [list $direction $exit_direction]]
		if {$new_connector_type==""} continue

		# don't add an arm back
		# also assemble the paths_out
		set loop 0
		set paths_out {}
		foreach path_source [dict keys $paths_in] {
			foreach path [dict get $paths_in $path_source] {
				foreach xyd $path {
					lassign $xyd otherX otherY
					if {$X==$otherX && $Y==$otherY} {set loop 1}
				}
				lappend path [list $x $y [::tile::next_link_id]]
				dict lappend paths_out $path_source $path
			}
		}
		if {$loop} continue

		# OK now attempt to add an arm to the neighbour
		set tiles [add_arm $X $Y $D $paths_out]
		if { $tiles=={} } continue
		break
	}
	if {$tiles=={}} { return {} }

	# now add the new link to this tile
	set link_id [::tile::new_link [list $direction $exit_direction]]
	::tile::set connector_type $new_connector_type
	::tile::set_paths $link_id in $direction $paths_in
	::tile::set_paths $link_id out $exit_direction $paths_out

	logToFile "Added $direction arm and $exit_direction arm to connector @ $x,$y\n[::tile::dump]" 2

	lappend tiles [list $x $y]
	return $tiles
}

# attempt to mix distinct netowrks on a (non-empty) grid
# a mix will only made between two networks where they do not share any primary colours
# will add as many mixes as possible, up to and including the maximum
# returns the number of mixes added
proc add_mixes { maximum mix_tiles } {

	set count 0
	while {$count<$maximum && $mix_tiles!={}} {
		# choose tile at random
		set index [expr {int(rand()*[llength $mix_tiles])}]
		lassign [lindex $mix_tiles $index] x y

		# remove tile from list
		set mix_tiles [lreplace $mix_tiles $index $index]
		
		# attempt to mix the network from this tile to some neighbouring tile
		if {[paths::mix_from $x $y]} {
			incr count
		}
	}

	return $count
}

# attempt to add filtering tiles that filter colours on a (non-empty, mixed-network) grid
# will add as many filters as possible, up to and including the maximum
# returns the number of filtering tiles added
proc add_filtering { maximum tiles } {

	set filtered_paths {}
	set prism_tiles $tiles
	set remaining_tiles {}

	# first attempt to add prisms, then filters
	set filter_count 0
	while {$filter_count<$maximum && $prism_tiles!={}} {
		# choose tile at random
		set index [expr {int(rand()*[llength $prism_tiles])}]
		set tile [lindex $prism_tiles $index]
		lassign $tile x y

		# remove tile from list
		set prism_tiles [lreplace $prism_tiles $index $index]

		if {[::filter::add_prism $x $y filtered_paths]} {
			incr filter_count
			logToFile "Added prism to tile @ $x,$y\n[::tile::dump]" 2
		} else {
			lappend remaining_tiles $tile
		}
	}

	# add filters now
	set filter_tiles $remaining_tiles
	set remaining_tiles {}
	while {$filter_count<$maximum && $filter_tiles!={}} {
		# choose tile at random
		set index [expr {int(rand()*[llength $filter_tiles])}]
		set tile [lindex $filter_tiles $index]
		lassign $tile x y

		# remove tile from list
		set filter_tiles [lreplace $filter_tiles $index $index]

		if {[filter::add_filter $x $y filtered_paths]} {
			incr filter_count
			logToFile "Added filter to tile @ $x,$y\n[::tile::dump]" 4
		} else {
			lappend remaining_tiles $tile
		}
	}

	return $filter_count
}

proc update_node_colours {nodes} {
	# update the colours on the nodes
	foreach node $nodes {
		lassign $node x y

		# mixing can leave a node lit by more than one source of the same colour
		remove_duplicate_colours $x $y

		set colour [colour::combine [::tile::colours]]
		if {$colour!=[::tile::get colour]} {
			::tile::set description "Node: $colour"
			::tile::set colour $colour
			::tile::set lit 0
			::tile::light_node
		}

		if {$colour eq ""} {
			logToFile "Black tile @ $x,$y"
		}
	}

}

# remove any duplicate colours going into a node
# may remove more incoming arms than is necessary
proc remove_duplicate_colours {x y} {
	logToFile "removing duplicate colours from node @ $x,$y\n[::tile::dump]" 3

	# how many directions does the node receive paths from?
	set path_directions 0
	::tile::each_link {	incr path_directions [::tile::paths_exist $link_id in] }

	foreach direction [::tiling::directions $x $y] {
		if {$path_directions<=1} { return }
		# check if this node is receiving the same colour more than once
		set colours [::tile::colours]
		set unique_colours [lsort -unique $colours]
		if {[llength $colours]==[llength $unique_colours]} { return }

		if {[set neighbour [::tile::neighbour $direction]]=={}} { continue }
		lassign $neighbour X Y D

		# remove the arm from the neighbour?
		if {[remove_arm $X $Y $D]} {
			paths::remove $x $y $direction
			# update description, colours on this tile
			update_tile $x $y
		}
	}
}

# remove the arm on tile x y if possible
# return 1 if removal was successful, otherwise 0
proc remove_arm {x y arm} {
	# check an arm exists
	set link_ids [::tile::link_ids $arm]
	if {$link_ids=={}} {return 0}

	# check we can actually remove an arm
	switch -- [::tile::get type] {
		"teleporter" -
		"prism" -
		"filter" -
		"node" {
			# nope
			return 0
		}
		"connector" {
			set link_id [lindex $link_ids 0]
			# a connector must have at least 2 arms
			set link [::tile::link $link_id]
			if {[llength $link]<=2} {return 0}

			# check if tile supported
			set new_connector_type [::tiling::remove_arm_connector_type $x $y $link_id $arm]
			if {$new_connector_type==""} {return 0}

			# remove the arm from the link
			set index [lsearch $link $arm]
			set link [lreplace $link $index $index]
			::tile::set_link $link_id $link
			::tile::set connector_type $new_connector_type
		}
		"source" {
			set link_id [lindex $link_ids 0]
			# remove the entire link
			::tile::delete_link $link_id
		}
	}

	# update the description etc
	update_tile $x $y

	# remove any paths coming in
	paths::remove $x $y $arm
	logToFile "removed arm from tile @ $x,$y:\n[::tile::dump]" 3

	return 1
}

# complete the tile at x y
# give it a name
# decide if it is a node
# if it is a node give it a colour 
proc update_tile {x y} {
	logToFile "completing tile @ $x,$y\n[::tile::dump]" 3

	# check if this is a connector that should be a node
	if {[::tile::get type]=="connector" && [::tile::get links]==1} {
		if {[llength [::tile::link 0]]==1} {
			::tile::set type "node"
			# what colour is the node
			set colour_list [::tile::link_colours 0]
			set colour [colour::combine $colour_list]
			::tile::set colour $colour
			::tile::set lit 0
			::grid::incr nodes
		}
	}

	::tiling::update_tile $x $y
	::tile::set complete 1
	logToFile "updated tile @ $x,$y:\n[::tile::dump]" 2
}

proc finalise_tile {x y} {
	if {[::tile::get type]=="node"} {
		# add an arm/link in every other direction
		foreach direction [::tiling::directions $x $y] {
			if {[::tile::link_ids $direction]!={}} continue
			::tile::new_link [list $direction]
		}
	}

	::tiling::finalise_tile $x $y
	logToFile "finished tile @ $x,$y:\n[::tile::dump]" 2
}

}
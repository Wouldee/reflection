
# currently the whole namespace gets deleted whenever a new game is started
# this is how the actual tile data gets reset, but it also deletes all the procedures
# could be improved by storing the tile data in a separate, unique namespace....

# procedures for manipulating tile objects
# most procedures take two implicit arguments, the x and y location/identity of the tile
# so the caller must set x and y as local variables before calling any of these procedures
namespace eval tile {

proc new_grid {} {
	namespace eval ::tile::data {
		variable tiles
		array unset tiles
	}
}

# create a new tile @ x,y
# type is source, connector, node, or teleporter
# colour is required if type is a source or a node
# the following additional attributes are initialised:
# complete (0)		boolean - is the tile complete, set to true when all the attributes are complete
# description			string - human-readable description of the tile, usually set by tile-specific code
# links (0)			integer - number of links
# all_link_ids			list - ordered list of link_ids
# symmetry			dict - each key is an integer representing a rotation; each value is a boolean indicating if the rotation is symmetrical
# fg_items			list of canvas geometry items that appear on top of the links
# link_items			list of canvas geometry items represen
# bg_items			list of canvas geometry items that appear under the links
# lit (0)			boolean - (nodes only) indicates whether the node is lit with its colour
# link_ids			dict - each key is a string representing a face of the tile (e.g. "n", "s"); each value is a list of link_ids,
#					one for each link that the face is a part of. This dict is initialised here (default = {} = no links)
#					the vast majority of faces will only be part of one link
# calls the procedure ::tiling::new_tile once these attributes have been set for any tiling-specific attributes (e.g. orientation)
proc new {type {colour ""}} {
	upvar x x
	upvar y y

	# the tile is a dict
	::set tile {}
	dict set tile type $type
	dict set tile complete 0
	dict set tile description ""
	dict set tile links 0
	dict set tile all_link_ids {}
	dict set tile symmetry {}
	dict set tile fg_items {}
	dict set tile link_items {}
	dict set tile bg_items {}

	# set type-specific attributes
	switch -- $type {
		"source" {
			dict set tile colour $colour
		}
		"connector" {
			dict set tile connector_type ""
		}
		"node" {
			dict set tile colour $colour
			dict set tile lit 0
			::grid::incr nodes
		}
		"telporter" {
			# nothing...
		}
	}

	# move to ::tiling::new_tile ....
	# initialise link_ids and neighbours
	# each direction has a list of link_ids that the direction is a part of
	foreach direction [::tiling::directions $x $y] {
		dict set tile link_ids $direction {}
		dict set tile neighbour $direction [::tiling::neighbour $x $y $direction]
	}

	# store the tile
	::set ::tile::data::tiles($x|$y) $tile

	::tiling::new_tile $x $y
}

# return true if the tile @ x,y exists
proc exists {x y} {
	return [info exists ::tile::data::tiles($x|$y)]
}

# return the tile as a string
# used for logging, temporary, currently the return valus is just the dict....
proc dump {} {
	upvar x x
	upvar y y
	return $::tile::data::tiles($x|$y)
}

proc store {} {
	upvar x x
	upvar y y
	::set tile $::tile::data::tiles($x|$y)

	array set attributes {}
	::set attributes(type) [dict get $tile type]
	::set attributes(all_link_ids) [dict get $tile all_link_ids]
	::set attributes(shape) [dict get $tile shape]
	::set attributes(orientation) [dict get $tile orientation]

	switch -- $attributes(type) {
		"source" {
			::set attributes(colour) [dict get $tile colour]
		}
		"connector" {
			::set attributes(connector_type) [dict get $tile connector_type]
		}
		"node" {
			::set attributes(colour) [dict get $tile colour]
		}
		"filter" {
			foreach colour [::colour::primaries] {::set attributes($colour) {}}
			foreach link_id [dict get $tile all_link_ids] {
				::set colour [dict get $tile $link_id filter]
				lappend attributes($colour) $link_id
			}
		}
		"prism" {
			::set attributes(prism_orientation) [dict get $tile prism_orientation]
			foreach colour [::colour::primaries] {::set attributes($colour) {}}
			foreach link_id [dict get $tile all_link_ids] {
				::set colour [dict get $tile $link_id filter]
				lappend attributes($colour) $link_id
			}
		}
	}

	foreach link_id [dict get $tile all_link_ids] {
		::set attributes($link_id) [dict get $tile $link_id link]
	}

	return [array get attributes]
}

proc restore {attribute_list} {
	upvar x x
	upvar y y

	array set attributes $attribute_list

	switch -- $attributes(type) {
		"source" {
			new source $attributes(colour)
		}
		"connector" {
			new connector
			::set connector_type $attributes(connector_type)
		}
		"node" {
			new node $attributes(colour)
		}
		"filter" {
			new filter
		}
		"prism" {
			new prism
			::set prism_orientation $attributes(prism_orientation)
		}
	}

	::set shape $attributes(shape)
	::set orientation $attributes(orientation)
	::set links 0

	foreach link_id $attributes(all_link_ids) {
		new_link $attributes($link_id)
		link_filter $link_id ""
	}

	if {$attributes(type)=="filter" || $attributes(type)=="prism"} {
		foreach colour [::colour::primaries] {
			foreach link_id $attributes($colour) {
				link_filter $link_id $colour
			}
		}
	}
}

# return one of the direct attributes of the tile @ x,y:
# complete
# description
# links
# all_link_ids
# fg_items
# link_items
# bg_items
# lit
# also any tiling-specific attribute, e.g. orientation
proc get {key} {
	upvar x x
	upvar y y
	return [dict get $::tile::data::tiles($x|$y) $key]
}

# set any direct attribute of the tile @ x,y (see get proc for a list)
# complete
# description
# fg_items
# link_items
# bg_items
# lit
# also any tiling-specific attribute, e.g. orientation
# note that the all_link_ids and links attributes should not be set directly, they are maintained internally
proc set {key value} {
	upvar x x
	upvar y y
	dict set ::tile::data::tiles($x|$y) $key $value
}

# unset any direct attribute of the tile @ x,y (see set proc for a list)
proc unset {key} {
	upvar x x
	upvar y y
	dict unset ::tile::data::tiles($x|$y) $key
}

# increment an integer attribute of the tile @ x,y
# currently there are none....
proc incr {key {by 1}} {
	upvar x x
	upvar y y
	dict incr ::tile::data::tiles($x|$y) $key $by
}

proc add {key args} {
	upvar x x
	upvar y y
	dict lappend ::tile::data::tiles($x|$y) $key {*}$args
}

# (called when the combined colour of the paths coming into the node @ x,y matches its colour)
# 
proc light_node {} {
	upvar x x
	upvar y y
	if {![dict get $::tile::data::tiles($x|$y) lit]} {
		dict set ::tile::data::tiles($x|$y) lit 1
		::grid::incr lit
	}
	::tiling::draw_tile $x $y
}

proc unlight_node {} {
	upvar x x
	upvar y y

	if {[dict get $::tile::data::tiles($x|$y) lit]} {
		dict set ::tile::data::tiles($x|$y) lit 0
		::grid::incr lit -1
	}
	::tiling::draw_tile $x $y
}

proc neighbour {direction} {
	upvar x x
	upvar y y
	return [dict get $::tile::data::tiles($x|$y) neighbour $direction]
}

proc set_neighbour {direction neighbour} {
	upvar x x
	upvar y y
	dict set ::tile::data::tiles($x|$y) neighbour $direction $neighbour
}

# return the link id of the link at x,y that has an arm in the given direction
proc link_ids {direction} {
	upvar x x
	upvar y y
	return [dict get $::tile::data::tiles($x|$y) link_ids $direction]
}

proc link {link_id} {
	upvar x x
	upvar y y
	return [dict get $::tile::data::tiles($x|$y) $link_id link]
}

proc next_link_id {} {
	upvar x x
	upvar y y

	::set all_link_ids [dict get $::tile::data::tiles($x|$y) all_link_ids]
	if {$all_link_ids=={}} {return 0}
	::set link_id [lindex $all_link_ids end]
	return [expr {$link_id+1}]
}

proc new_link {link} {
	upvar x x
	upvar y y

	# determine the next link_id
	::set all_link_ids [dict get $::tile::data::tiles($x|$y) all_link_ids]
	::set link_id [next_link_id]
	# update the list of link_ids with the new link_id
	dict set ::tile::data::tiles($x|$y) all_link_ids [lappend all_link_ids $link_id]
	# update the link count
	dict incr ::tile::data::tiles($x|$y) links

	# create the new link, initialise the colours
	dict set ::tile::data::tiles($x|$y) $link_id link $link
	dict set ::tile::data::tiles($x|$y) $link_id colours {}

	# update the link_ids for each arm on the new link
	::set link_ids [dict get $::tile::data::tiles($x|$y) link_ids]
	foreach arm $link {
		dict lappend link_ids $arm $link_id
	}
	dict set ::tile::data::tiles($x|$y) link_ids $link_ids

	# return the new link_id
	return $link_id
}

proc delete_link {link_id} {
	upvar x x
	upvar y y

	# update the link_ids for each arm on the deleted link
	::set link_ids [dict get $::tile::data::tiles($x|$y) link_ids]
	foreach arm [dict get $::tile::data::tiles($x|$y) $link_id link] {
		# get index of the link_id in the arms list of link_ids
		::set index [lsearch [dict get $link_ids $arm] $link_id]
		dict set link_ids $arm [lreplace [dict get $link_ids $arm] $index $index]
	}
	dict set ::tile::data::tiles($x|$y) link_ids $link_ids

	# update the list of all link_ids for the tile
	::set all_link_ids [dict get $::tile::data::tiles($x|$y) all_link_ids]
	::set index [lsearch $all_link_ids $link_id]
	dict set ::tile::data::tiles($x|$y) all_link_ids [lreplace $all_link_ids $index $index]

	# decrement link_count
	dict incr ::tile::data::tiles($x|$y) links -1

	# delete the link from this tile
	dict unset ::tile::data::tiles($x|$y) $link_id
}

proc set_link {link_id link} {
	upvar x x
	upvar y y

	# update the link_ids for each arm on the deleted link
	::set link_ids [dict get $::tile::data::tiles($x|$y) link_ids]
	foreach arm [dict get $::tile::data::tiles($x|$y) $link_id link] {
		# get index of the link_id in the arms list of link_ids
		::set index [lsearch [dict get $link_ids $arm] $link_id]
		dict set link_ids $arm [lreplace [dict get $link_ids $arm] $index $index]
	}

	# add the link_id to the link_ids for the new arms
	foreach arm $link {
		dict lappend link_ids $arm $link_id
	}
	dict set ::tile::data::tiles($x|$y) link_ids $link_ids

	# update the actual link
	dict set ::tile::data::tiles($x|$y) $link_id link $link
}

proc add_arm {link_id arm} {
	upvar x x
	upvar y y

	# update the list of link_ids for this arm
	::set link_ids [dict get $::tile::data::tiles($x|$y) link_ids]
	dict lappend link_ids $arm $link_id
	dict set ::tile::data::tiles($x|$y) link_ids $link_ids

	# update the link
	::set link [dict get $::tile::data::tiles($x|$y) $link_id link]
	lappend link $arm
	dict set ::tile::data::tiles($x|$y) $link_id link $link
}

proc update_link_colours {link_id} {
	upvar x x
	upvar y y
	
	# build a list of all the colours coming in
	::set colour_list {}
	foreach arm [dict get $::tile::data::tiles($x|$y) $link_id link] {
		if {![dict exists $::tile::data::tiles($x|$y) $link_id paths in $arm]} continue
		foreach path_source [dict keys [dict get $::tile::data::tiles($x|$y) $link_id paths in $arm]] {
			lassign $path_source X Y
			lappend colour_list [tile_colour $X $Y]
		}
	}

	# check if this is a source, add the colour of the source to the list
	if {[dict get $::tile::data::tiles($x|$y) type]=="source"} {
		lappend colour_list [dict get $::tile::data::tiles($x|$y) colour]
	}

	# update the colours for this link
	dict set ::tile::data::tiles($x|$y) $link_id colours $colour_list
	::tiling::redraw_links $x $y

	if {[dict get $::tile::data::tiles($x|$y) type]=="node"} {
		update_node
	}
}

proc update_node {} {
	upvar x x
	upvar y y

	# build a list of all the colours coming in
	set colour_list {}
	each_link { lappend colour_list {*}[::tile::link_colours $link_id] }

	# determine the colour of this node
	::set colour [colour::combine $colour_list]

	# does the colour match
	if {$colour==[dict get $::tile::data::tiles($x|$y) colour]} {
		light_node
	} else {
		unlight_node
	}
}

proc arm_colours {link_id arm} {
	upvar x x
	upvar y y

	::set colour_list {}
	if {[dict exists $::tile::data::tiles($x|$y) $link_id paths in $arm]} {
		foreach path_source [dict keys [dict get $::tile::data::tiles($x|$y) $link_id paths in $arm]] {
			lassign $path_source X Y
			lappend colour_list [tile_colour $X $Y]
		}
	}
	if {[dict exists $::tile::data::tiles($x|$y) $link_id paths out $arm]} {
		foreach path_source [dict keys [dict get $::tile::data::tiles($x|$y) $link_id paths out $arm]] {
			lassign $path_source X Y
			lappend colour_list [tile_colour $X $Y]
		}
	}

	return $colour_list
}

proc colours {} {
	upvar x x
	upvar y y

	set colours {}
	foreach link_id [dict get $::tile::data::tiles($x|$y) all_link_ids] {
		lappend colours {*}[dict get $::tile::data::tiles($x|$y) $link_id colours]
	}

	return $colours
}

proc link_colours {link_id} {
	upvar x x
	upvar y y
	return [dict get $::tile::data::tiles($x|$y) $link_id colours]
}

proc link_filter {link_id args} {
	upvar x x
	upvar y y

	if {$args!={}} {
		::set colour [lindex $args 0]
		dict set ::tile::data::tiles($x|$y) $link_id filter $colour
	}
	return [dict get $::tile::data::tiles($x|$y) $link_id filter]
}

proc paths_exist {link_id args} {
	upvar x x
	upvar y y
	return [dict exists $::tile::data::tiles($x|$y) $link_id paths {*}$args]
}

proc paths {link_id args} {
	upvar x x
	upvar y y
	return [dict get $::tile::data::tiles($x|$y) $link_id paths {*}$args]
}

proc set_paths {link_id args} {
	upvar x x
	upvar y y

	::set keys [lrange $args 0 end-1]
	::set paths [lindex $args end]

	dict set ::tile::data::tiles($x|$y) $link_id paths {*}$keys $paths
	update_link_colours $link_id
}

proc delete_paths {link_id args} {
	upvar x x
	upvar y y

	::set keys [linsert $args 0 "paths"]
	::set first 1

	while {[dict exists $::tile::data::tiles($x|$y) $link_id {*}$keys]} {
		if {!$first && [dict get $::tile::data::tiles($x|$y) $link_id {*}$keys]!={}} break
		dict unset ::tile::data::tiles($x|$y) $link_id {*}$keys
		::set keys [lrange $keys 0 end-1]
		::set first 0
	}

	update_link_colours $link_id
}

# perform the action on every link for this tile
# variables provided: link is in link, link_id is in link_id
# support for alternate varnames for link and link_id as 3rd and 4th arguments respectively
proc each_link {action} {
	upvar x x
	upvar y y

	upvar link link
	upvar link_id link_id

	# each link_id
	foreach link_id [dict get $::tile::data::tiles($x|$y) all_link_ids] {
		# set the link
		::set link [dict get $::tile::data::tiles($x|$y) $link_id link]

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

proc tile {x y} {
	return $::tile::data::tiles($x|$y)
}

proc tile_colour {x y} {
	return [dict get $::tile::data::tiles($x|$y) colour]
}

proc print_tile {x y} {
	::set tile $::tile::data::tiles($x|$y)

	append print_tile "\n[dict get $tile description] ([dict get $tile type])"
	append print_tile [dict get $tile link_id] 
	each_link  {
		append print_tile "\n\tlink $link_id"
		foreach arm $link {
			append print_tile "\n\t\t[string toupper $arm] in:"
			if {[dict exists $tile $link_id paths in $arm]} {
				::set paths [paths $link_id in $arm]
				foreach path_source [dict keys $paths] {
					append print_tile "\n\t\t\tfrom $path_source:\n\t\t\t\t[join [dict get $paths $path_source] "\n\t\t\t\t"]"
				}
			}
			append print_tile "\n\t\t[string toupper $arm] out:"
			if {[dict exists $tile $link_id paths out $arm]} {
				::set paths [paths $link_id out $arm]
				foreach path_source [dict keys $paths] {
					append print_tile "\n\t\t\tfrom $path_source:\n\t\t\t\t[join [dict get $paths $path_source] "\n\t\t\t\t"]"
				}
			}
		}
	}
	append print_tile "\nsymmetry:"
	foreach key [dict keys [dict get $tile symmetry]] {
		append print_tile "\n$key [dict get [dict get $tile symmetry] $key]"
	}

	if {[dict get $tile type]!="connector"} {
		append print_tile "\ncolour = [dict get $tile colour]"
	}
	if {[dict get $tile type]=="node"} {
		if {[dict get $tile lit]} {
			append print_tile "\nlit"
		} else {
			append print_tile "\nunlit"
		}
	}
	append print_tile "canvas fg items:\n"
	foreach item [dict get $tile fg_items] {
		append print_tile ""
	}
	
	return $print_tile
}

}

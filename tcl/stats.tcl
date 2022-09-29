

namespace eval ::stats {
variable records
variable recorded_fields {
	time
	par_time
	moves
	par
	score
	rating
}

proc best {level_no record} {
	variable records

	if {[dict exists $records $level_no $record]} {
		return [dict get $records $level_no $record]
	} else {
		return ""
	}
}

proc average {record} {
	variable records

	set total 0.0
	set count 0

	foreach level $::levels {
		set level_no [lindex $level 0]
		if {[dict exists $records $level_no $record]} {
			set total [expr {$total + [dict get $records $level_no $record]}]
		}
		incr count
	}

	return [expr {$total/$count}]
}

proc total {record} {
	variable records

	set total 0.0

	foreach level $::levels {
		set level_no [lindex $level 0]
		if {[dict exists $records $level_no $record]} {
			set total [expr {$total + [dict get $records $level_no $record]}]
		}
	}

	return $total
}

proc update_level {level_no args} {
	variable records
	variable recorded_fields

	array set new_records $args
	foreach field [array names new_records] {
		switch -- $field {
			"par_time" {}
			"time" {
				set new_time $new_records(time)
				set new_par_time $new_records(par_time)
				if {[dict exists $records $level_no time]} {
					set record_time [dict get $records $level_no time]
					set record_par_time [dict get $records $level_no par_time]
					if {($new_time-$new_par_time)>=($record_time-$record_par_time)} { continue }
				}

				dict set records $level_no time $new_time
				dict set records $level_no par_time $new_par_time
			}
			"par" {}
			"moves" {
				set new_moves $new_records(moves)
				set new_par $new_records(par)
				if {[dict exists $records $level_no moves]} {
					set record_moves [dict get $records $level_no moves]
					set record_par [dict get $records $level_no par]
					if {($new_moves-$new_par)>=($record_moves-$record_par)} { continue }
				}

				dict set records $level_no moves $new_moves
				dict set records $level_no par $new_par
			}
			"score" {
				set new_score $new_records(score)
				if {[dict exists $records $level_no score]} {
					set record_score [dict get $records $level_no score]
					if {$new_score<=$record_score} { continue }
				}

				dict set records $level_no score $new_score
			}
			"rating" {
				set new_rating $new_records(rating)
				if {[dict exists $records $level_no rating]} {
					set record_rating [dict get $records $level_no rating]
					if {$new_rating<=$record_rating} { continue }
				}

				dict set records $level_no rating $new_rating
			}
		}
	}

	save
}


proc load {} {
	variable records {}
	variable recorded_fields

	if {![file exists $::statsFile]} {return}

	set level_index 0
	set fid [open $::statsFile]
	while {![eof $fid]} {
		set line [gets $fid]
		set record_list [lassign $line level_no level_args]
		while 1 {
			set level [lindex $::levels $level_index]
			if {[lindex $level 0]==$level_no} { break }
			if {[incr level_index]>=[llength $::levels]} {
				close $fid
				return
			}
		}
		if {$level_args!=[lassign $level level_no]} { continue }

		foreach {field record} $record_list {
			if {[lsearch $recorded_fields $field]<0} { continue }
			dict set records $level_no $field $record
		}
	}
	close $fid
}

proc save {} {
	variable records
	variable recorded_fields

	set fid [open $::statsFile w]
	foreach level $::levels {
		set level_args [lassign $level level_no]
		if {![dict exists $records $level_no]} { continue }

		set line_values {}
		lappend line_values $level_no
		lappend line_values $level_args
		foreach field $recorded_fields {
			set record [dict get $records $level_no $field]
			lappend line_values $field $record
		}
		puts $fid $line_values
	}
	close $fid
}

}
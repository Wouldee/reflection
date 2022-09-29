
proc process_args {options_array arguments defaults} {
	upvar $options_array options

	# set the defaults
	array set options $defaults
	set option ""
	set index 0
	set leftover_args {}
	while 1 {
		# get the next argument
		if {$index<[llength $arguments]} {
			set arg [lindex $arguments $index]
		}

		# argument is an option
		if {$index>=[llength $arguments] || [string index $arg 0]=="-"} {
			# process the previous option & value
			if {$option!=""} {
				if {[info exists options($option)]} {
					if {![info exists value]} {set value 1}
					set options($option) $value
				} else {
					lappend leftover_args "-$option"
					if {[info exists value]} {
						lappend leftover_args $value
					}
				}
			}

			if {$index>=[llength $arguments]} break

			# set the option, reset the value
			set option [string range $arg 1 end]
			catch { unset value }
		} elseif {$option!=""} {
			set value $arg
		} else {
			error "error parsing args"
		}

		incr index
	}

	return $leftover_args
}

proc display_time {seconds} {
	set seconds [expr {round($seconds)}]
	if {$seconds<60} {
		return [clock format $seconds -format ":%S" -gmt 1]
	} elseif {$seconds<3600} {
		return [clock format $seconds -format "%M:%S" -gmt 1]
	} else {
		return [clock format $seconds -format "%T" -gmt 1]
	}
}

proc comma_number {integer} {
	set segments {}
	set remaining_int $integer
	while {$remaining_int!=""} {
		lappend segments [string range $remaining_int end-2 end]
		set remaining_int [string range $remaining_int 0 end-3]
	}

	set comma_number [join [lreverse $segments] ","]
	return $comma_number
}

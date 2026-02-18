<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue"
import {
  CalendarRoot,
  type CalendarRootEmits,
  type CalendarRootProps,
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "~/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next"

const props = defineProps<
  CalendarRootProps & { class?: HTMLAttributes["class"] }
>()

const emits = defineEmits<CalendarRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    :class="cn('p-3', props.class)"
    v-bind="forwarded"
  >
    <CalendarHeader class="relative flex w-full items-center justify-between pt-1">
      <CalendarPrev
        class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </CalendarPrev>
      <CalendarHeading class="text-sm font-medium" />
      <CalendarNext
        class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </CalendarNext>
    </CalendarHeader>

    <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse space-y-1">
        <CalendarGridHead>
          <CalendarGridRow class="flex">
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="flex w-full mt-2"
          >
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
              class="relative flex h-8 w-8 items-center justify-center text-center text-sm p-0"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                :class="
                  cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:focus:bg-primary',
                    'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
                    'data-[unavailable]:text-muted-foreground data-[unavailable]:line-through',
                    'data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50',
                    '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground'
                  )
                "
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>

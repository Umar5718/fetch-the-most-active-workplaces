import axios from 'axios';

interface Workplace {
  id: number;
  name: string;
  status: number;
}

interface Shift {
  id: number;
  workplaceId: number;
  workerId: number | null;
}

interface PaginatedResponse<T> {
  data: T[];
  links: { next?: string };
}

interface WorkplaceShiftCount {
  name: string;
  shifts: number;
}

const API_BASE_URL = 'http://localhost:3000';

async function fetchAllWorkplaces(): Promise<Workplace[]> {
  const workplaces: Workplace[] = [];
  let nextUrl = `${API_BASE_URL}/workplaces`;

  while (nextUrl) {
    const response = await axios.get<PaginatedResponse<Workplace>>(nextUrl);
    workplaces.push(...response.data.data);
    nextUrl = response.data.links.next || '';
  }

  return workplaces;
}

async function fetchAllShifts(): Promise<Shift[]> {
  const shifts: Shift[] = [];
  let nextUrl = `${API_BASE_URL}/shifts`;

  while (nextUrl) {
    const response = await axios.get<PaginatedResponse<Shift>>(nextUrl);
    shifts.push(...response.data.data);
    nextUrl = response.data.links.next || '';
  }

  return shifts;
}

async function getTopWorkplaces(): Promise<WorkplaceShiftCount[]> {
  try {
    // Fetch all workplaces and shifts
    const [workplaces, shifts] = await Promise.all([
      fetchAllWorkplaces(),
      fetchAllShifts()
    ]);

    // Filter for active workplaces (status = 0)
    const activeWorkplaces = workplaces.filter(workplace => workplace.status === 0);

    // Count completed shifts per workplace (shifts with workerId not null)
    const completedShifts = shifts.filter(shift => shift.workerId !== null);
    const shiftCounts = new Map<number, number>();

    completedShifts.forEach(shift => {
      const currentCount = shiftCounts.get(shift.workplaceId) || 0;
      shiftCounts.set(shift.workplaceId, currentCount + 1);
    });

    // Create workplace shift count objects for active workplaces only
    const workplaceShiftCounts: WorkplaceShiftCount[] = activeWorkplaces
      .map(workplace => ({
        name: workplace.name,
        shifts: shiftCounts.get(workplace.id) || 0
      }))
      .sort((a, b) => b.shifts - a.shifts) // Sort by shift count descending
      .slice(0, 3); // Take top 3

    return workplaceShiftCounts;
  } catch (error) {
    throw new Error(`Failed to fetch top workplaces: ${error}`);
  }
}

// Main execution
getTopWorkplaces()
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
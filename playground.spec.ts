import { test, expect } from "@playwright/test";
import {
  login,
  autocomplete,
  list,
  selectRadio,
  loginAPI,
  createApiContext,
  getInitials,
} from "../helpers/helper";

test.describe("testing playwright on clinic uat", () => {
  test("homepage has title", async ({ page }) => {
    await login(page, "admin", "eee");
  });

  test("open master data pharmacy and input drug", async ({ page }) => {
    await login(page, "admin", "eee");

    await page.getByText("Master Data").click();

    await page.getByText("Barang Farmasi").click();

    await page.locator(".mdi-plus").click();

    expect(
      page.getByRole("heading", { name: " Barang Farmasi " })
    ).toBeVisible();

    await page.fill("#name", "Paracetamol");

    await page.fill("#barcode", "981031234");

    await autocomplete(page, "Pilih Kategori", "obat", false);

    await selectRadio(page, "isGeneric", "Ya");

    await autocomplete(page, "Pilih Golongan", "Bebas", true);

    await page.fill("#rak", "A1A");

    await autocomplete(page, "Pilih Sediaan", "Concentrate", true);

    await autocomplete(page, "Pilih Pabrik", "3M", true);

    await page.getByPlaceholder("0").fill("10");

    await list(page, "Pilih farmako terapi", "Alpha Blocker");

    await page.fill("#indikasi", "pusing");

    await page.fill("#efeksamping", "mengantuk");

    await selectRadio(page, "isCatastrophic", "Ya");

    await selectRadio(page, "isHighAlert", "Ya");

    await selectRadio(page, "isVEN", "Ya");

    await autocomplete(page, "Pilih kekuatan unit", "Ampul", true);

    await page.fill("#kekuatan", "500");

    await page.locator("#hna").last().fill("500");

    await page.locator("#hpp").last().fill("500");

    await page.mouse.wheel(0, 10);

    await autocomplete(page, "Pilih cara pakai", "Infus", true);

    await page.fill("#kontraindikasi", "mual");

    await page.fill("#bahanbaku", "mual");

    await selectRadio(page, "isFormulary", "Ya");

    await selectRadio(page, "isFornas", "Ya");

    await selectRadio(page, "isPotent", "Ya");
  });

  test("API testing login", async ({ page }) => {
    await loginAPI("admin", "eee");
    await loginAPI("dokter03", "Neurovi123");
  });

  test("add schedule default via API", async ({ page }) => {
    await loginAPI("admin", "eee");
    const apiContext = await createApiContext();
    const getStaff = await apiContext.get(
      "/master/staff?role[]=Dokter&role[]=Bidan&role[]=dokter&role[]=bidan&role[]=fisioterapis&role[]=Fisioterapis",
      { headers: { Authorization: `${process.env.API_TOKEN}` } }
    );
    const staffResult = await getStaff.json();
    const mappedStaff = new Set<{ name: string; id_staff: string }>(
      staffResult.data
        .filter((v: any) => v.role.status)
        .map((x: any) => ({
          name: x.detail.name,
          id_staff: x._id,
          status: x.role.status,
        }))
    );

    const getUnit = await apiContext.get(
      "master/unit?page=1&itemCount=&search=&sort=name",
      { headers: { Authorization: `${process.env.API_TOKEN}` } }
    );
    const unitResult = await getUnit.json();
    const mappedUnit = unitResult.data
      .filter((x: any) => x.detail.installation == "Instalasi Rawat Jalan")
      .map((v: any) => ({ unit_name: v.name, id_unit: v._id }));

    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    const getSchedule = await apiContext.post("/schedule", {
      data: {
        startDate: today,
        endDate: sevenDaysLater,
        id_staff: "",
        isActive: true,
      },
      headers: { Authorization: `${process.env.API_TOKEN}` },
    });
    const scheduleResult = await getSchedule.json();

    const scheduledStaff = new Set(
      scheduleResult.data.map((s: { id_staff: string }) => ({
        name: s.id_staff,
      }))
    );
    const availableStaff: { name: string; id_staff: string }[] = Array.from(
      mappedStaff.values()
    ).filter(
      (staff: any) =>
        !Array.from(scheduledStaff).some(
          (scheduled: any) => scheduled.name === staff.name
        )
    );
    for (const [index, v] of mappedUnit.entries()) {
      try {
        const initials =
          getInitials(availableStaff[0]?.name || "", true) + index;
        const postScheduledefault = await apiContext.post("/schedule/default", {
          data: {
            id_staff: availableStaff[0]?.id_staff,
            id_unit: v.id_unit,
            schedule: [
              {
                day: 1,
                start_time: "23:23",
                end_time: "23:24",
                quota: "123",
                room: "123",
              },
              {
                day: 2,
                start_time: "23:23",
                end_time: "23:24",
                quota: "123",
                room: "123",
              },
              {
                day: 3,
                start_time: "23:23",
                end_time: "23:24",
                quota: "123",
                room: "123",
              },
              {
                day: 4,
                start_time: "23:23",
                end_time: "23:24",
                quota: "123",
                room: "123",
              },
              {
                day: 5,
                start_time: "23:23",
                end_time: "23:24",
                quota: "123",
                room: "123",
              },
              {
                day: 6,
                start_time: "23:23",
                end_time: "23:24",
                quota: "123",
                room: "123",
              },
              {
                day: 7,
                start_time: "23:23",
                end_time: "23:24",
                quota: "132",
                room: "123",
              },
            ],
            queue_code: initials,
            timestamps: { created_by: "5fb92977add95e45ab123342" },
          },
          headers: { Authorization: `${process.env.API_TOKEN}` },
        });

        console.log(
          "Successfully added schedule default for",
          availableStaff[0]?.name,
          "in unit",
          mappedUnit[index].unit_name
        );

        if (!postScheduledefault.ok()) {
          throw new Error(
            `postScheduledefault failed: ${postScheduledefault.status()}`
          );
        }
      } catch (error) {
        console.error(
          "Error adding schedule default for unit",
          mappedUnit[index].unit_name,
          ":",
          error
        );
      }
    }
  });
});

// export default {...);

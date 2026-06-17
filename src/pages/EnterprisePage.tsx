import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Check,
  ChevronRight,
  Eye,
  Factory,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { enterpriseApi, type EnterpriseDepartment, type EnterpriseOrganization } from '@/api/enterprise.api';
import { customConfirm } from '@/shared/lib/toast-utils';

type Step = 'organization' | 'department' | 'position' | 'employee';

const emptyOrgForm = { displayName: '', displayNameRu: '' };
const emptyDeptForm = { displayName: '', displayNameRu: '' };
const emptyPositionForm = { displayName: '', displayNameRu: '' };
const emptyEmployeeForm = { departmentId: '', departmentName: '', position: '', fullName: '', employeeId: '' };

const departmentKey = (department?: EnterpriseDepartment) => department?.id || department?.name || '';
const getOrgEmployeeCount = (org: EnterpriseOrganization) => org.departments.reduce((sum, department) => sum + department.employeeCount, 0);

export default function EnterprisePage() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language?.startsWith('ru');
  const tr = (key: string, fallbackUz: string, fallbackRu = fallbackUz) => t(key, { defaultValue: isRu ? fallbackRu : fallbackUz });

  const [organizations, setOrganizations] = useState<EnterpriseOrganization[]>([]);
  const [selectedOrgCode, setSelectedOrgCode] = useState('MOF-3');
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState('');
  const [selectedPositionName, setSelectedPositionName] = useState('');
  const [activeStep, setActiveStep] = useState<Step>('employee');
  const [editingOrgCode, setEditingOrgCode] = useState<string | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [orgForm, setOrgForm] = useState(emptyOrgForm);
  const [deptForm, setDeptForm] = useState(emptyDeptForm);
  const [positionForm, setPositionForm] = useState(emptyPositionForm);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [modalEmployeeForm, setModalEmployeeForm] = useState(emptyEmployeeForm);
  const [viewingDepartmentKey, setViewingDepartmentKey] = useState('');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Step | null>(null);

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.organizationCode === selectedOrgCode) || organizations[0],
    [organizations, selectedOrgCode],
  );
  const departments = selectedOrg?.departments || [];
  const selectedDepartment = useMemo(
    () => departments.find((department) => departmentKey(department) === selectedDepartmentKey) || departments[0],
    [departments, selectedDepartmentKey],
  );
  const viewingDepartment = useMemo(
    () => departments.find((department) => departmentKey(department) === viewingDepartmentKey),
    [departments, viewingDepartmentKey],
  );
  const positions = selectedDepartment?.positions || [];
  const selectedPosition = useMemo(
    () => positions.find((position) => position.name === selectedPositionName) || positions[0],
    [positions, selectedPositionName],
  );

  const orgLabel = (org?: EnterpriseOrganization) => {
    if (!org) return tr('enterprise.emptyOrg', 'Korxona tanlanmagan');
    return (isRu ? org.displayNameRu || org.displayName : org.displayName || org.displayNameRu) || org.organizationCode;
  };
  const departmentLabel = (department?: EnterpriseDepartment) => {
    if (!department) return tr('enterprise.emptyDepartment', "Bo'lim tanlanmagan");
    return (isRu ? department.displayNameRu || department.displayName : department.displayName || department.displayNameRu) || department.name;
  };
  const positionLabel = (position?: { name: string; displayName?: string; displayNameRu?: string }) => {
    if (!position) return tr('enterprise.emptyPosition', 'Lavozim tanlanmagan');
    return (isRu ? position.displayNameRu || position.displayName : position.displayName || position.displayNameRu) || position.name;
  };

  const filteredDepartments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return departments;

    return departments.filter((department) => {
      const searchable = [
        department.name,
        department.displayName,
        department.displayNameRu,
        ...department.positions.map((position) => position.name),
        ...department.positions.flatMap((position) =>
          position.employees.map((employee) => `${employee.fullName} ${employee.employeeId}`),
        ),
      ];
      return searchable.some((value) => String(value || '').toLowerCase().includes(normalized));
    });
  }, [departments, query]);

  const modalEmployees = useMemo(() => {
    if (!viewingDepartment) return [];
    return viewingDepartment.positions.flatMap((position) =>
      position.employees.map((employee) => ({ ...employee, position: position.name })),
    );
  }, [viewingDepartment]);
  const modalPositions = viewingDepartment?.positions || [];

  const totals = useMemo(() => {
    const departmentCount = organizations.reduce((sum, org) => sum + org.departments.length, 0);
    const employeeCount = organizations.reduce((sum, org) => sum + getOrgEmployeeCount(org), 0);
    const positionCount = organizations.reduce(
      (sum, org) => sum + org.departments.reduce((deptSum, department) => deptSum + department.positions.length, 0),
      0,
    );
    return { organizations: organizations.length, departments: departmentCount, positions: positionCount, employees: employeeCount };
  }, [organizations]);

  const loadTree = async (preferredOrg = selectedOrgCode, preferredDepartment = selectedDepartmentKey) => {
    setLoading(true);
    try {
      const res = await enterpriseApi.getTree();
      const nextOrganizations = Array.isArray(res?.organizations) ? res.organizations : [];
      setOrganizations(nextOrganizations);

      const nextOrgCode = nextOrganizations.some((org) => org.organizationCode === preferredOrg)
        ? preferredOrg
        : nextOrganizations[0]?.organizationCode || 'MOF-3';
      setSelectedOrgCode(nextOrgCode);

      const nextDepartments = nextOrganizations.find((org) => org.organizationCode === nextOrgCode)?.departments || [];
      const nextDepartment = nextDepartments.find((department) =>
        departmentKey(department) === preferredDepartment ||
        department.name === preferredDepartment ||
        department.displayName === preferredDepartment ||
        department.displayNameRu === preferredDepartment,
      ) || nextDepartments[0];
      setSelectedDepartmentKey(nextDepartment ? departmentKey(nextDepartment) : '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('enterprise.errors.load', "Korxona ma'lumotlari yuklanmadi"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTree();
  }, []);

  useEffect(() => {
    if (!viewingDepartment) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewingDepartment]);

  useEffect(() => {
    if (!selectedDepartment) {
      setEmployeeForm(emptyEmployeeForm);
      return;
    }
    setEmployeeForm((current) => ({
      ...current,
      departmentId: selectedDepartment.id || '',
      departmentName: selectedDepartment.name,
      position: selectedPosition?.name || '',
    }));
    setSelectedPositionName((current) => (positions.some((position) => position.name === current) ? current : positions[0]?.name || ''));
  }, [selectedDepartment, selectedPosition?.name, positions]);

  const selectOrganization = (organizationCode: string) => {
    const org = organizations.find((item) => item.organizationCode === organizationCode);
    setSelectedOrgCode(organizationCode);
    setSelectedDepartmentKey(org?.departments[0] ? departmentKey(org.departments[0]) : '');
    setSelectedPositionName('');
    setQuery('');
    setActiveStep(org?.departments.length ? 'employee' : 'department');
    cancelEdit();
  };

  const selectDepartment = (department: EnterpriseDepartment) => {
    setSelectedDepartmentKey(departmentKey(department));
    setSelectedPositionName(department.positions[0]?.name || '');
    setActiveStep(department.positions.length ? 'employee' : 'position');
    cancelDepartmentEdit();
  };

  const openDepartmentModal = (department: EnterpriseDepartment) => {
    setSelectedDepartmentKey(departmentKey(department));
    setSelectedPositionName(department.positions[0]?.name || '');
    setViewingDepartmentKey(departmentKey(department));
    setEditingEmployeeId(null);
    setModalEmployeeForm({
      ...emptyEmployeeForm,
      departmentId: department.id || '',
      departmentName: department.name,
      position: department.positions[0]?.name || '',
    });
  };

  const closeDepartmentModal = () => {
    setViewingDepartmentKey('');
    setEditingEmployeeId(null);
    setModalEmployeeForm(emptyEmployeeForm);
  };

  const beginEmployeeEdit = (employee: { fullName: string; employeeId: string; position: string }) => {
    if (!viewingDepartment) return;
    setEditingEmployeeId(employee.employeeId);
    setModalEmployeeForm({
      departmentId: viewingDepartment.id || '',
      departmentName: viewingDepartment.name,
      position: employee.position,
      fullName: employee.fullName,
      employeeId: employee.employeeId,
    });
  };

  const resetModalEmployeeForm = () => {
    if (!viewingDepartment) {
      setModalEmployeeForm(emptyEmployeeForm);
      return;
    }
    setEditingEmployeeId(null);
    setModalEmployeeForm({
      ...emptyEmployeeForm,
      departmentId: viewingDepartment.id || '',
      departmentName: viewingDepartment.name,
      position: viewingDepartment.positions[0]?.name || '',
    });
  };

  const beginOrgEdit = (org: EnterpriseOrganization) => {
    setEditingOrgCode(org.organizationCode);
    setOrgForm({
      displayName: org.displayName || org.organizationCode,
      displayNameRu: org.displayNameRu || org.displayName || org.organizationCode,
    });
    setActiveStep('organization');
  };

  const beginDepartmentEdit = (department: EnterpriseDepartment) => {
    if (!department.id) return toast.error(tr('enterprise.errors.departmentEditUnavailable', "Bu bo'limni tahrirlab bo'lmaydi"));
    setEditingDepartmentId(department.id);
    setDeptForm({
      displayName: department.displayName || department.name,
      displayNameRu: department.displayNameRu || department.displayName || department.name,
    });
    setSelectedDepartmentKey(departmentKey(department));
    setActiveStep('department');
  };

  const cancelEdit = () => {
    setEditingOrgCode(null);
    setEditingDepartmentId(null);
    setOrgForm(emptyOrgForm);
    setDeptForm(emptyDeptForm);
    setPositionForm(emptyPositionForm);
  };

  const handleCreatePosition = async (event: FormEvent) => {
    event.preventDefault();
    const displayName = positionForm.displayName.trim();
    const displayNameRu = positionForm.displayNameRu.trim();
    if (!selectedOrg?.organizationCode || !selectedDepartment || (!displayName && !displayNameRu)) {
      toast.error(tr('enterprise.errors.positionRequired', 'Lavozim nomini kiriting'));
      return;
    }

    setSaving('position');
    try {
      const created = await enterpriseApi.createPosition({
        organizationCode: selectedOrg.organizationCode,
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        displayName,
        displayNameRu,
      });
      toast.success(tr('enterprise.messages.positionCreated', "Lavozim qo'shildi"));
      setPositionForm(emptyPositionForm);
      setSelectedPositionName(created?.name || displayName || displayNameRu);
      setActiveStep('employee');
      await loadTree(selectedOrg.organizationCode, selectedDepartmentKey);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('common.error', 'Xatolik yuz berdi'));
    } finally {
      setSaving(null);
    }
  };

  const cancelDepartmentEdit = () => {
    setEditingDepartmentId(null);
    setDeptForm(emptyDeptForm);
  };

  const handleSaveOrganization = async (event: FormEvent) => {
    event.preventDefault();
    const displayName = orgForm.displayName.trim();
    const displayNameRu = orgForm.displayNameRu.trim();
    if (!displayName && !displayNameRu) {
      toast.error(tr('enterprise.errors.orgRequired', 'Korxona nomi kiritilishi shart'));
      return;
    }

    setSaving('organization');
    try {
      if (editingOrgCode) {
        await enterpriseApi.updateOrganization(editingOrgCode, { displayName, displayNameRu });
        toast.success(tr('enterprise.messages.orgUpdated', 'Korxona yangilandi'));
        await loadTree(editingOrgCode, selectedDepartmentKey);
      } else {
        const created = await enterpriseApi.createOrganization({ displayName, displayNameRu });
        toast.success(tr('enterprise.messages.orgCreated', "Korxona qo'shildi"));
        await loadTree(created?.organizationCode || selectedOrgCode, '');
        setActiveStep('department');
      }
      setOrgForm(emptyOrgForm);
      setEditingOrgCode(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('common.error', 'Xatolik yuz berdi'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveDepartment = async (event: FormEvent) => {
    event.preventDefault();
    const displayName = deptForm.displayName.trim();
    const displayNameRu = deptForm.displayNameRu.trim();
    if (!selectedOrg?.organizationCode || (!displayName && !displayNameRu)) {
      toast.error(tr('enterprise.errors.departmentRequired', "Bo'lim nomini kiriting"));
      return;
    }

    setSaving('department');
    try {
      if (editingDepartmentId) {
        await enterpriseApi.updateDepartment(editingDepartmentId, { displayName, displayNameRu });
        toast.success(tr('enterprise.messages.departmentUpdated', "Bo'lim yangilandi"));
        await loadTree(selectedOrg.organizationCode, editingDepartmentId);
      } else {
        const created = await enterpriseApi.createDepartment({
          organizationCode: selectedOrg.organizationCode,
          displayName,
          displayNameRu,
        });
        toast.success(tr('enterprise.messages.departmentCreated', "Bo'lim qo'shildi"));
        await loadTree(selectedOrg.organizationCode, created?.id || displayName || displayNameRu);
        setActiveStep('employee');
      }
      setDeptForm(emptyDeptForm);
      setEditingDepartmentId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('common.error', 'Xatolik yuz berdi'));
    } finally {
      setSaving(null);
    }
  };

  const handleCreateEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !selectedOrg?.organizationCode ||
      !employeeForm.departmentName ||
      !employeeForm.position.trim() ||
      !employeeForm.fullName.trim() ||
      !employeeForm.employeeId.trim()
    ) {
      toast.error(tr('enterprise.errors.employeeRequired', "Bo'lim, lavozim, F.I.O. va tabel raqamini to'ldiring"));
      return;
    }

    setSaving('employee');
    try {
      await enterpriseApi.createEmployee({
        organizationCode: selectedOrg.organizationCode,
        ...employeeForm,
        position: employeeForm.position.trim(),
        fullName: employeeForm.fullName.trim(),
        employeeId: employeeForm.employeeId.trim(),
      });
      toast.success(tr('enterprise.messages.employeeCreated', "Xodim verify ro'yxatiga qo'shildi"));
      setEmployeeForm((current) => ({
        ...emptyEmployeeForm,
        departmentId: current.departmentId,
        departmentName: current.departmentName,
      }));
      await loadTree(selectedOrg.organizationCode, selectedDepartmentKey);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('common.error', 'Xatolik yuz berdi'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveModalEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !selectedOrg?.organizationCode ||
      !viewingDepartment ||
      !modalEmployeeForm.position.trim() ||
      !modalEmployeeForm.fullName.trim() ||
      !modalEmployeeForm.employeeId.trim()
    ) {
      toast.error(tr('enterprise.errors.employeeRequired', "Bo'lim, lavozim, F.I.O. va tabel raqamini to'ldiring"));
      return;
    }

    setSaving('employee');
    try {
      const payload = {
        organizationCode: selectedOrg.organizationCode,
        ...modalEmployeeForm,
        departmentId: viewingDepartment.id || '',
        departmentName: viewingDepartment.name,
        position: modalEmployeeForm.position.trim(),
        fullName: modalEmployeeForm.fullName.trim(),
        employeeId: modalEmployeeForm.employeeId.trim(),
      };
      if (editingEmployeeId) {
        await enterpriseApi.updateEmployee(editingEmployeeId, payload);
        toast.success(tr('enterprise.messages.employeeUpdated', 'Xodim yangilandi'));
      } else {
        await enterpriseApi.createEmployee(payload);
        toast.success(tr('enterprise.messages.employeeCreated', "Xodim verify ro'yxatiga qo'shildi"));
      }
      resetModalEmployeeForm();
      await loadTree(selectedOrg.organizationCode, departmentKey(viewingDepartment));
      setViewingDepartmentKey(departmentKey(viewingDepartment));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('common.error', 'Xatolik yuz berdi'));
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!selectedOrg?.organizationCode || !viewingDepartment) return;
    customConfirm(
      tr('enterprise.confirm.deleteEmployee', "Xodimni ro'yxatdan o'chirasizmi?", 'Удалить сотрудника из списка?'),
      () => {
        void (async () => {
          setSaving('employee');
          try {
            await enterpriseApi.deleteEmployee(employeeId, { organizationCode: selectedOrg.organizationCode });
            toast.success(tr('enterprise.messages.employeeDeleted', "Xodim o'chirildi", 'Сотрудник удален'));
            if (editingEmployeeId === employeeId) resetModalEmployeeForm();
            await loadTree(selectedOrg.organizationCode, departmentKey(viewingDepartment));
            setViewingDepartmentKey(departmentKey(viewingDepartment));
          } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || tr('common.error', 'Xatolik yuz berdi', 'Произошла ошибка'));
          } finally {
            setSaving(null);
          }
        })();
      },
      {
        cancelLabel: tr('common.cancel', 'Bekor qilish', 'Отмена'),
        confirmLabel: tr('common.confirm', 'Tasdiqlash', 'Подтвердить'),
      },
    );
  };

  return (
    <div className="enterprise-page">
      <style>{`
        .enterprise-page { display: flex; flex-direction: column; gap: 16px; min-height: calc(100vh - 96px); }
        .enterprise-shell { border: 1px solid var(--border-1); background: linear-gradient(180deg, var(--surface-1), rgba(255,255,255,0.02)); border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-md); }
        .enterprise-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 18px 20px; border-bottom: 1px solid var(--border-1); background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(20, 184, 166, 0.08)), var(--bg-2); }
        .enterprise-title-row { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .enterprise-title-icon { width: 46px; height: 46px; border-radius: 8px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #2563eb, #0f766e); box-shadow: 0 12px 26px rgba(37, 99, 235, 0.2); flex: 0 0 auto; }
        .enterprise-title { margin: 0; color: var(--text-primary); font-size: 24px; line-height: 1.1; font-weight: 950; letter-spacing: 0; }
        .enterprise-subtitle { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.45; }
        .enterprise-refresh { height: 40px; padding: 0 13px; border: 1px solid var(--border-2); border-radius: 8px; background: var(--surface-1); color: var(--text-primary); display: inline-flex; align-items: center; gap: 8px; font-weight: 850; cursor: pointer; }
        .enterprise-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--border-1); border-bottom: 1px solid var(--border-1); }
        .enterprise-stat { background: var(--bg-1); padding: 13px 16px; display: flex; align-items: center; gap: 10px; }
        .enterprise-stat-icon { width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center; color: #2563eb; background: rgba(37, 99, 235, 0.1); flex: 0 0 auto; }
        .enterprise-stat-value { color: var(--text-primary); font-size: 20px; line-height: 1; font-weight: 950; }
        .enterprise-stat-label { margin-top: 3px; color: var(--text-muted); font-size: 11px; font-weight: 800; }
        .enterprise-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 14px; border-bottom: 1px solid var(--border-1); background: var(--bg-1); }
        .enterprise-step { border: 1px solid var(--border-1); background: var(--bg-2); color: var(--text-secondary); border-radius: 8px; min-height: 58px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; }
        .enterprise-step.active { border-color: rgba(37, 99, 235, 0.42); color: var(--text-primary); background: linear-gradient(135deg, rgba(37,99,235,0.16), rgba(20,184,166,0.08)); }
        .enterprise-step-index { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; color: #fff; background: #334155; font-weight: 950; flex: 0 0 auto; }
        .enterprise-step.active .enterprise-step-index { background: linear-gradient(135deg, #2563eb, #0f766e); }
        .enterprise-step strong { display: block; color: var(--text-primary); font-size: 13px; line-height: 1.2; }
        .enterprise-step span span { display: block; margin-top: 3px; color: var(--text-muted); font-size: 11px; line-height: 1.25; }
        .enterprise-body { display: grid; grid-template-columns: 340px minmax(0, 1fr) 400px; min-height: 620px; }
        .enterprise-column { min-width: 0; border-right: 1px solid var(--border-1); background: var(--bg-1); }
        .enterprise-column:last-child { border-right: none; }
        .enterprise-column-head { min-height: 72px; padding: 14px; border-bottom: 1px solid var(--border-1); display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--bg-2); }
        .enterprise-column-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 950; font-size: 14px; }
        .enterprise-column-sub { margin-top: 4px; color: var(--text-muted); font-size: 11px; line-height: 1.35; }
        .enterprise-search { position: relative; padding: 12px 14px; border-bottom: 1px solid var(--border-1); }
        .enterprise-search svg { position: absolute; left: 26px; top: 24px; color: var(--text-muted); }
        .enterprise-search input { width: 100%; height: 40px; border: 1px solid var(--border-2); border-radius: 8px; background: var(--bg-1); color: var(--text-primary); padding: 0 12px 0 38px; outline: none; }
        .enterprise-search input:focus, .enterprise-field input:focus, .enterprise-field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
        .enterprise-list { display: flex; flex-direction: column; gap: 8px; padding: 14px; max-height: 534px; overflow: auto; }
        .enterprise-select-card { border: 1px solid var(--border-1); border-radius: 8px; background: var(--bg-2); color: var(--text-primary); padding: 12px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; text-align: left; cursor: pointer; }
        .enterprise-select-card.active { border-color: rgba(37, 99, 235, 0.46); background: linear-gradient(135deg, rgba(37,99,235,0.14), rgba(20,184,166,0.08)); box-shadow: inset 3px 0 0 #2563eb; }
        .enterprise-card-title { display: flex; align-items: center; gap: 8px; min-width: 0; font-weight: 950; font-size: 14px; }
        .enterprise-card-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .enterprise-code { margin-top: 5px; color: var(--text-muted); font-size: 11px; font-weight: 750; }
        .enterprise-card-meta { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
        .enterprise-chip { display: inline-flex; align-items: center; gap: 5px; min-height: 24px; border: 1px solid var(--border-1); border-radius: 999px; background: var(--surface-1); color: var(--text-secondary); padding: 0 8px; font-size: 11px; font-weight: 850; }
        .enterprise-chip.ok { border-color: rgba(22, 163, 74, 0.24); background: rgba(22, 163, 74, 0.1); color: #16a34a; }
        .enterprise-card-actions { display: flex; align-items: center; gap: 8px; }
        .enterprise-edit { width: 32px; height: 32px; border: 1px solid var(--border-1); border-radius: 8px; display: grid; place-items: center; color: var(--text-secondary); background: var(--bg-1); cursor: pointer; }
        .enterprise-main { min-width: 0; background: var(--bg-0); }
        .enterprise-preview { padding: 16px; }
        .enterprise-path { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; color: var(--text-muted); font-size: 12px; font-weight: 850; }
        .enterprise-path strong { color: var(--text-primary); }
        .enterprise-table { border: 1px solid var(--border-1); border-radius: 8px; overflow: hidden; background: var(--bg-1); }
        .enterprise-table-row { display: grid; grid-template-columns: minmax(180px, 1.5fr) minmax(120px, 1fr) 110px; gap: 12px; align-items: center; padding: 11px 13px; border-top: 1px solid var(--border-1); color: var(--text-secondary); font-size: 13px; }
        .enterprise-table-row:first-child { border-top: none; }
        .enterprise-table-head { background: var(--bg-2); color: var(--text-muted); font-size: 11px; font-weight: 950; text-transform: uppercase; }
        .enterprise-table-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); font-weight: 850; }
        .enterprise-form-panel { background: var(--bg-1); }
        .enterprise-form-wrap { padding: 16px; }
        .enterprise-context { border: 1px solid rgba(37,99,235,0.22); background: rgba(37,99,235,0.08); border-radius: 8px; padding: 11px; display: flex; align-items: flex-start; gap: 9px; color: var(--text-secondary); font-size: 12px; line-height: 1.45; margin-bottom: 14px; }
        .enterprise-form { display: flex; flex-direction: column; gap: 12px; }
        .enterprise-field { display: flex; flex-direction: column; gap: 7px; }
        .enterprise-field label { color: var(--text-secondary); font-size: 12px; font-weight: 900; }
        .enterprise-field input, .enterprise-field select { width: 100%; min-height: 44px; border: 1px solid var(--border-2); border-radius: 8px; background: var(--bg-2); color: var(--text-primary); padding: 0 12px; outline: none; font: inherit; }
        .enterprise-submit-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
        .enterprise-submit, .enterprise-cancel { min-height: 44px; border: 0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 950; cursor: pointer; }
        .enterprise-submit { background: linear-gradient(135deg, #2563eb, #0f766e); color: #fff; box-shadow: 0 14px 28px rgba(37,99,235,0.18); }
        .enterprise-cancel { min-width: 44px; border: 1px solid var(--border-2); background: var(--bg-2); color: var(--text-secondary); }
        .enterprise-submit:disabled { opacity: 0.62; cursor: not-allowed; box-shadow: none; }
        .enterprise-empty { min-height: 240px; border: 1px dashed var(--border-2); border-radius: 8px; display: grid; place-items: center; text-align: center; padding: 24px; color: var(--text-muted); background: var(--bg-1); }
        .enterprise-empty-icon { width: 44px; height: 44px; margin: 0 auto 10px; display: grid; place-items: center; border-radius: 8px; color: #2563eb; background: rgba(37,99,235,0.1); }
        .spin { animation: enterprise-spin 0.9s linear infinite; }
        @keyframes enterprise-spin { to { transform: rotate(360deg); } }
        @media (max-width: 1280px) { .enterprise-body { grid-template-columns: 300px minmax(0, 1fr); } .enterprise-form-panel { grid-column: 1 / -1; border-top: 1px solid var(--border-1); } }
        .enterprise-position-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
        .enterprise-position-button { border: 1px solid var(--border-1); border-radius: 999px; background: var(--surface-1); color: var(--text-secondary); min-height: 30px; padding: 0 10px; font-size: 12px; font-weight: 850; cursor: pointer; }
        .enterprise-position-button.active { border-color: rgba(37,99,235,0.38); background: rgba(37,99,235,0.12); color: var(--text-primary); }
        .enterprise-modal-backdrop { position: fixed; inset: 0; z-index: 9999; background: rgba(2, 6, 23, 0.74); backdrop-filter: blur(16px); display: grid; place-items: center; padding: 22px; overflow: auto; overscroll-behavior: contain; }
        .enterprise-modal { position: relative; width: min(1080px, 100%); max-height: min(820px, calc(100vh - 44px)); overflow: hidden; border: 1px solid rgba(148,163,184,0.22); border-radius: 8px; background: color-mix(in srgb, var(--bg-1) 92%, transparent); box-shadow: 0 32px 90px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,255,255,0.04) inset; display: grid; grid-template-rows: auto minmax(0, 1fr); animation: enterpriseModalIn .18s ease-out; }
        .enterprise-modal::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, #2563eb, #0f766e, #22c55e); pointer-events: none; }
        .enterprise-modal-head { padding: 20px; border-bottom: 1px solid var(--border-1); background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(20,184,166,0.10)), var(--bg-2); display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
        .enterprise-modal-title { display: flex; align-items: center; gap: 10px; color: var(--text-primary); font-size: 19px; line-height: 1.2; font-weight: 950; letter-spacing: 0; }
        .enterprise-modal-title svg { width: 38px; height: 38px; padding: 9px; border-radius: 8px; color: #fff; background: linear-gradient(135deg, #2563eb, #0f766e); box-shadow: 0 12px 24px rgba(37,99,235,0.18); }
        .enterprise-modal-sub { margin-top: 7px; color: var(--text-secondary); font-size: 12px; line-height: 1.45; font-weight: 750; }
        .enterprise-modal-close { width: 38px; height: 38px; border: 1px solid var(--border-2); border-radius: 8px; background: rgba(255,255,255,0.04); color: var(--text-secondary); display: grid; place-items: center; cursor: pointer; }
        .enterprise-modal-close:hover { color: var(--text-primary); border-color: var(--border-3); }
        .enterprise-modal-body { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 360px; overflow: hidden; }
        .enterprise-modal-main { min-width: 0; overflow: auto; padding: 18px; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent); }
        .enterprise-modal-side { border-left: 1px solid var(--border-1); background: linear-gradient(180deg, var(--bg-2), var(--bg-1)); padding: 18px; overflow: auto; }
        .enterprise-modal-table { border: 1px solid var(--border-1); border-radius: 8px; overflow: hidden; background: var(--bg-1); box-shadow: var(--shadow-sm); }
        .enterprise-modal-row { display: grid; grid-template-columns: minmax(190px,1.3fr) minmax(130px,1fr) 92px 96px; gap: 10px; align-items: center; padding: 13px; border-top: 1px solid var(--border-1); color: var(--text-secondary); font-size: 13px; }
        .enterprise-modal-row:first-child { border-top: 0; }
        .enterprise-modal-row.head { background: var(--bg-2); color: var(--text-muted); font-size: 11px; font-weight: 950; text-transform: uppercase; }
        .enterprise-row-actions { display: flex; justify-content: flex-end; gap: 7px; }
        .enterprise-mini-action { width: 32px; height: 32px; border: 1px solid var(--border-1); border-radius: 8px; background: var(--bg-2); color: var(--text-secondary); display: grid; place-items: center; cursor: pointer; }
        .enterprise-mini-action.danger { color: var(--red-400); }
        @keyframes enterpriseModalIn { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 860px) { .enterprise-header, .enterprise-body, .enterprise-modal-body { grid-template-columns: 1fr; } .enterprise-stats, .enterprise-steps { grid-template-columns: 1fr; } .enterprise-column { border-right: none; border-bottom: 1px solid var(--border-1); } .enterprise-modal-side { border-left: 0; border-top: 1px solid var(--border-1); } .enterprise-table-row, .enterprise-modal-row { grid-template-columns: 1fr; gap: 4px; } .enterprise-row-actions { justify-content: flex-start; } }
      `}</style>

      <section className="enterprise-shell">
        <header className="enterprise-header">
          <div className="enterprise-title-row">
            <div className="enterprise-title-icon"><Factory size={22} /></div>
            <div>
              <h1 className="enterprise-title">{tr('enterprise.title', 'Korxona')}</h1>
              <p className="enterprise-subtitle">
                {tr('enterprise.subtitle', "Verify uchun korxona, bo'lim va xodimlarni MOF-3 namunasi bo'yicha yuriting.")}
              </p>
            </div>
          </div>
          <button className="enterprise-refresh" type="button" onClick={() => void loadTree()} disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : <RefreshCcw size={16} />}
            {tr('common.refresh', 'Yangilash')}
          </button>
        </header>

        <div className="enterprise-stats">
          <Stat icon={<Building2 size={17} />} value={totals.organizations} label={tr('enterprise.stats.organizations', 'Korxonalar')} />
          <Stat icon={<Layers3 size={17} />} value={totals.departments} label={tr('enterprise.stats.departments', "Bo'limlar")} />
          <Stat icon={<ShieldCheck size={17} />} value={totals.positions} label={tr('enterprise.stats.positions', 'Lavozimlar')} />
          <Stat icon={<UsersRound size={17} />} value={totals.employees} label={tr('enterprise.stats.employees', 'Xodimlar')} />
        </div>

        <div className="enterprise-steps">
          <StepButton active={activeStep === 'organization'} index="1" title={tr('enterprise.steps.organization', "Korxona qo'shish")} subtitle={tr('enterprise.steps.organizationSub', 'Faqat nomlar kiritiladi')} onClick={() => { setActiveStep('organization'); setEditingOrgCode(null); setOrgForm(emptyOrgForm); }} />
          <StepButton active={activeStep === 'department'} index="2" title={tr('enterprise.steps.department', "Bo'lim qo'shish")} subtitle={orgLabel(selectedOrg)} onClick={() => { setActiveStep('department'); setEditingDepartmentId(null); setDeptForm(emptyDeptForm); }} />
          <StepButton active={activeStep === 'position'} index="3" title={tr('enterprise.steps.position', "Lavozim qo'shish")} subtitle={departmentLabel(selectedDepartment)} onClick={() => setActiveStep('position')} />
          <StepButton active={activeStep === 'employee'} index="4" title={tr('enterprise.steps.employee', "Xodim qo'shish")} subtitle={positionLabel(selectedPosition)} onClick={() => setActiveStep('employee')} />
        </div>

        <div className="enterprise-body">
          <aside className="enterprise-column">
            <ColumnHead icon={<Building2 size={16} />} title={tr('enterprise.orgs.title', 'Korxonalar')} sub={tr('enterprise.orgs.sub', "Korxonani tanlang yoki tahrirlang.")} />
            <div className="enterprise-list">
              {loading ? <Empty icon={<Loader2 className="spin" size={22} />} text={tr('common.loading', 'Yuklanmoqda')} /> : organizations.map((org) => (
                <button className={`enterprise-select-card ${org.organizationCode === selectedOrg?.organizationCode ? 'active' : ''}`} key={org.organizationCode} type="button" onClick={() => selectOrganization(org.organizationCode)}>
                  <div>
                    <div className="enterprise-card-title"><Factory size={16} /><span>{orgLabel(org)}</span></div>
                    <div className="enterprise-code">{org.organizationCode}</div>
                    <div className="enterprise-card-meta">
                      <span className="enterprise-chip">{org.departments.length} {tr('enterprise.stats.departments', "bo'lim")}</span>
                      <span className="enterprise-chip ok">{getOrgEmployeeCount(org)} {tr('enterprise.stats.employees', 'xodim')}</span>
                    </div>
                  </div>
                  <div className="enterprise-card-actions">
                    <span className="enterprise-edit" onClick={(event) => { event.stopPropagation(); beginOrgEdit(org); }} title={tr('common.edit', 'Tahrirlash')}><Pencil size={14} /></span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="enterprise-main">
            <ColumnHead icon={<Layers3 size={16} />} title={orgLabel(selectedOrg)} sub={tr('enterprise.departments.sub', "Bo'limni tanlang. Tanlangan bo'limga xodim qo'shish formasi avtomatik bog'lanadi.")} />
            <div className="enterprise-search">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr('enterprise.search', "Bo'lim, lavozim, xodim yoki tabel raqami...")} />
            </div>
            <div className="enterprise-list">
              {loading ? <Empty icon={<Loader2 className="spin" size={22} />} text={tr('common.loading', 'Yuklanmoqda')} /> : filteredDepartments.length === 0 ? <Empty icon={<Layers3 size={22} />} text={tr('enterprise.departments.empty', "Bu korxonada bo'lim topilmadi")} /> : filteredDepartments.map((department) => (
                <button className={`enterprise-select-card ${departmentKey(department) === departmentKey(selectedDepartment) ? 'active' : ''}`} key={departmentKey(department)} type="button" onClick={() => selectDepartment(department)}>
                  <div>
                    <div className="enterprise-card-title"><Layers3 size={16} /><span>{departmentLabel(department)}</span></div>
                    <div className="enterprise-code">{department.name}</div>
                    <div className="enterprise-card-meta">
                      <span className="enterprise-chip">{department.positions.length} {tr('enterprise.stats.positions', 'lavozim')}</span>
                      <span className="enterprise-chip ok">{department.employeeCount} {tr('enterprise.stats.employees', 'xodim')}</span>
                    </div>
                    {department.positions.length > 0 && (
                      <div className="enterprise-position-list">
                        {department.positions.slice(0, 5).map((position) => (
                          <span className="enterprise-chip" key={position.name}>{positionLabel(position)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="enterprise-card-actions">
                    <span className="enterprise-edit" onClick={(event) => { event.stopPropagation(); openDepartmentModal(department); }} title={tr('enterprise.actions.viewEmployees', "Xodimlarni ko'rish")}><Eye size={14} /></span>
                    <span className="enterprise-edit" onClick={(event) => { event.stopPropagation(); beginDepartmentEdit(department); }} title={tr('common.edit', 'Tahrirlash')}><Pencil size={14} /></span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="enterprise-column enterprise-form-panel">
            <ColumnHead icon={activeStep === 'organization' ? <Building2 size={16} /> : activeStep === 'department' ? <Layers3 size={16} /> : activeStep === 'position' ? <ShieldCheck size={16} /> : <UserPlus size={16} />} title={getStepTitle(activeStep, Boolean(editingOrgCode || editingDepartmentId), tr)} sub={getStepSub(activeStep, tr)} />
            <div className="enterprise-form-wrap">
              {activeStep === 'organization' && (
                <form className="enterprise-form" onSubmit={handleSaveOrganization}>
                  <Context icon={<ShieldCheck size={16} />} text={tr('enterprise.context.orgNames', "Korxona kodi avtomatik yaratiladi. Siz faqat o'zbekcha va ruscha nom kiriting.")} />
                  <Field label={tr('enterprise.fields.nameUz', "O'zbekcha nom")}>
                    <input value={orgForm.displayName} onChange={(event) => setOrgForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="MOF-3" />
                  </Field>
                  <Field label={tr('enterprise.fields.nameRu', 'Русское название')}>
                    <input value={orgForm.displayNameRu} onChange={(event) => setOrgForm((current) => ({ ...current, displayNameRu: event.target.value }))} placeholder="МОФ-3" />
                  </Field>
                  <SubmitRow loading={saving === 'organization'} showCancel={Boolean(editingOrgCode)} onCancel={cancelEdit} label={editingOrgCode ? tr('common.save', 'Saqlash') : tr('enterprise.actions.addOrg', "Korxona qo'shish")} />
                </form>
              )}

              {activeStep === 'department' && (
                <form className="enterprise-form" onSubmit={handleSaveDepartment}>
                  <Context icon={<Building2 size={16} />} text={`${tr('enterprise.context.selectedOrg', 'Tanlangan korxona')}: ${orgLabel(selectedOrg)}`} />
                  <Field label={tr('enterprise.fields.nameUz', "O'zbekcha nom")}>
                    <input value={deptForm.displayName} onChange={(event) => setDeptForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Texnologiya bo'limi" disabled={!selectedOrg || loading} />
                  </Field>
                  <Field label={tr('enterprise.fields.nameRu', 'Русское название')}>
                    <input value={deptForm.displayNameRu} onChange={(event) => setDeptForm((current) => ({ ...current, displayNameRu: event.target.value }))} placeholder="Технологический отдел" disabled={!selectedOrg || loading} />
                  </Field>
                  <SubmitRow loading={saving === 'department'} disabled={!selectedOrg || loading} showCancel={Boolean(editingDepartmentId)} onCancel={cancelDepartmentEdit} label={editingDepartmentId ? tr('common.save', 'Saqlash') : tr('enterprise.actions.addDepartment', "Bo'lim qo'shish")} />
                </form>
              )}

              {activeStep === 'position' && (
                <form className="enterprise-form" onSubmit={handleCreatePosition}>
                  <Context icon={<Layers3 size={16} />} text={`${tr('enterprise.context.selectedDepartment', "Tanlangan bo'lim")}: ${departmentLabel(selectedDepartment)}`} />
                  <Field label={tr('enterprise.fields.nameUz', "O'zbekcha nom")}>
                    <input value={positionForm.displayName} onChange={(event) => setPositionForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Operator" disabled={!selectedDepartment || loading} />
                  </Field>
                  <Field label={tr('enterprise.fields.nameRu', 'Русское название')}>
                    <input value={positionForm.displayNameRu} onChange={(event) => setPositionForm((current) => ({ ...current, displayNameRu: event.target.value }))} placeholder="Оператор" disabled={!selectedDepartment || loading} />
                  </Field>
                  <SubmitRow loading={saving === 'position'} disabled={!selectedDepartment || loading} label={tr('enterprise.actions.addPosition', "Lavozim qo'shish")} />
                  {positions.length > 0 && (
                    <div className="enterprise-position-list">
                      {positions.map((position) => (
                        <button className={`enterprise-position-button ${position.name === selectedPosition?.name ? 'active' : ''}`} type="button" key={position.name} onClick={() => { setSelectedPositionName(position.name); setActiveStep('employee'); }}>
                          {positionLabel(position)}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              )}

              {activeStep === 'employee' && (
                <form className="enterprise-form" onSubmit={handleCreateEmployee}>
                  <Context icon={<Check size={16} />} text={`${orgLabel(selectedOrg)} / ${departmentLabel(selectedDepartment)}`} />
                  <Field label={tr('enterprise.fields.department', "Bo'lim")}>
                    <select value={employeeForm.departmentId || employeeForm.departmentName} onChange={(event) => { const department = departments.find((item) => departmentKey(item) === event.target.value); if (department) selectDepartment(department); }} disabled={!selectedOrg || departments.length === 0 || loading}>
                      <option value="">{tr('enterprise.placeholders.department', "Bo'lim tanlang")}</option>
                      {departments.map((department) => <option key={departmentKey(department)} value={departmentKey(department)}>{departmentLabel(department)}</option>)}
                    </select>
                  </Field>
                  <Field label={tr('enterprise.fields.position', 'Lavozim / soha')}>
                    <select value={employeeForm.position} onChange={(event) => { setSelectedPositionName(event.target.value); setEmployeeForm((current) => ({ ...current, position: event.target.value })); }} disabled={!selectedDepartment || positions.length === 0 || loading}>
                      <option value="">{tr('enterprise.placeholders.position', 'Lavozim tanlang')}</option>
                      {positions.map((position) => <option key={position.name} value={position.name}>{positionLabel(position)}</option>)}
                    </select>
                  </Field>
                  <Field label={tr('enterprise.fields.fullName', 'F.I.O.')}>
                    <input value={employeeForm.fullName} onChange={(event) => setEmployeeForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Aliyev Ali Aliyevich" disabled={!selectedDepartment || loading} />
                  </Field>
                  <Field label={tr('enterprise.fields.employeeId', 'Tabel raqami')}>
                    <input value={employeeForm.employeeId} onChange={(event) => setEmployeeForm((current) => ({ ...current, employeeId: event.target.value }))} placeholder="1607" disabled={!selectedDepartment || loading} />
                  </Field>
                  <SubmitRow loading={saving === 'employee'} disabled={!selectedDepartment || loading} label={tr('enterprise.actions.addEmployee', "Xodim qo'shish")} />
                </form>
              )}
            </div>
          </aside>
        </div>
      </section>

      {viewingDepartment && createPortal((
        <div className="enterprise-modal-backdrop" role="dialog" aria-modal="true" onClick={closeDepartmentModal}>
          <section className="enterprise-modal" onClick={(event) => event.stopPropagation()}>
            <header className="enterprise-modal-head">
              <div>
                <div className="enterprise-modal-title"><Eye size={19} /> {departmentLabel(viewingDepartment)}</div>
                <div className="enterprise-modal-sub">
                  {orgLabel(selectedOrg)} / {modalEmployees.length} {tr('enterprise.stats.employees', 'xodim', 'сотрудник')} / {modalPositions.length} {tr('enterprise.stats.positions', 'lavozim', 'должность')}
                </div>
              </div>
              <button className="enterprise-modal-close" type="button" onClick={closeDepartmentModal} title={tr('common.close', 'Yopish', 'Закрыть')}>
                <X size={18} />
              </button>
            </header>

            <div className="enterprise-modal-body">
              <div className="enterprise-modal-main">
                {modalEmployees.length === 0 ? (
                  <Empty icon={<UsersRound size={22} />} text={tr('enterprise.employees.empty', "Tanlangan bo'limda hali xodim yo'q", 'В выбранном отделе пока нет сотрудников')} />
                ) : (
                  <div className="enterprise-modal-table">
                    <div className="enterprise-modal-row head">
                      <span>{tr('enterprise.table.employee', 'Xodim', 'Сотрудник')}</span>
                      <span>{tr('enterprise.table.position', 'Lavozim', 'Должность')}</span>
                      <span>{tr('enterprise.table.employeeId', 'Tabel', 'Табель')}</span>
                      <span>{tr('common.actions', 'Amallar', 'Действия')}</span>
                    </div>
                    {modalEmployees.map((employee) => {
                      const position = modalPositions.find((item) => item.name === employee.position);
                      return (
                        <div className="enterprise-modal-row" key={`${employee.employeeId}-${employee.fullName}-${employee.position}`}>
                          <span className="enterprise-table-name">{employee.fullName}</span>
                          <span>{positionLabel(position || { name: employee.position })}</span>
                          <strong>{employee.employeeId}</strong>
                          <span className="enterprise-row-actions">
                            <button className="enterprise-mini-action" type="button" onClick={() => beginEmployeeEdit(employee)} title={tr('common.edit', 'Tahrirlash', 'Редактировать')}>
                              <Pencil size={14} />
                            </button>
                            <button className="enterprise-mini-action danger" type="button" onClick={() => void handleDeleteEmployee(employee.employeeId)} title={tr('common.delete', "O'chirish", 'Удалить')}>
                              <Trash2 size={14} />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside className="enterprise-modal-side">
                <ColumnHead
                  icon={<UserPlus size={16} />}
                  title={editingEmployeeId ? tr('enterprise.forms.employeeEditTitle', 'Xodimni tahrirlash', 'Редактировать сотрудника') : tr('enterprise.forms.employeeTitle', "Xodim qo'shish", 'Добавить сотрудника')}
                  sub={tr('enterprise.forms.employeeModalSub', "Xodim tanlangan bo'lim verify ro'yxatida saqlanadi.", 'Сотрудник сохраняется в verify-списке выбранного отдела.')}
                />
                <div style={{ height: 14 }} />
                <form className="enterprise-form" onSubmit={handleSaveModalEmployee}>
                  <Context icon={<Check size={16} />} text={`${orgLabel(selectedOrg)} / ${departmentLabel(viewingDepartment)}`} />
                  <Field label={tr('enterprise.fields.position', 'Lavozim / soha', 'Должность / направление')}>
                    <select
                      value={modalEmployeeForm.position}
                      onChange={(event) => setModalEmployeeForm((current) => ({ ...current, position: event.target.value }))}
                      disabled={modalPositions.length === 0 || loading}
                    >
                      <option value="">{tr('enterprise.placeholders.position', 'Lavozim tanlang', 'Выберите должность')}</option>
                      {modalPositions.map((position) => (
                        <option key={position.name} value={position.name}>{positionLabel(position)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={tr('enterprise.fields.fullName', 'F.I.O.', 'Ф.И.О.')}>
                    <input
                      value={modalEmployeeForm.fullName}
                      onChange={(event) => setModalEmployeeForm((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder="Aliyev Ali Aliyevich"
                      disabled={loading}
                    />
                  </Field>
                  <Field label={tr('enterprise.fields.employeeId', 'Tabel raqami', 'Табельный номер')}>
                    <input
                      value={modalEmployeeForm.employeeId}
                      onChange={(event) => setModalEmployeeForm((current) => ({ ...current, employeeId: event.target.value }))}
                      placeholder="1607"
                      disabled={loading}
                    />
                  </Field>
                  <SubmitRow
                    loading={saving === 'employee'}
                    disabled={modalPositions.length === 0 || loading}
                    showCancel={Boolean(editingEmployeeId)}
                    onCancel={resetModalEmployeeForm}
                    label={editingEmployeeId ? tr('common.save', 'Saqlash', 'Сохранить') : tr('enterprise.actions.addEmployee', "Xodim qo'shish", 'Добавить сотрудника')}
                  />
                </form>
              </aside>
            </div>
          </section>
        </div>
      ), document.body)}
    </div>
  );
}

function getStepTitle(step: Step, editing: boolean, tr: (key: string, fallback: string) => string) {
  if (step === 'organization') return editing ? tr('enterprise.forms.orgEditTitle', 'Korxonani tahrirlash') : tr('enterprise.forms.orgTitle', "Korxona qo'shish");
  if (step === 'department') return editing ? tr('enterprise.forms.departmentEditTitle', "Bo'limni tahrirlash") : tr('enterprise.forms.departmentTitle', "Bo'lim qo'shish");
  if (step === 'position') return tr('enterprise.forms.positionTitle', "Lavozim qo'shish");
  return tr('enterprise.forms.employeeTitle', "Xodim qo'shish");
}

function getStepSub(step: Step, tr: (key: string, fallback: string) => string) {
  if (step === 'organization') return tr('enterprise.forms.orgSub', 'Faqat o‘zbekcha va ruscha nom kerak.');
  if (step === 'department') return tr('enterprise.forms.departmentSub', "Bo'lim tanlangan korxona ichida yaratiladi.");
  if (step === 'position') return tr('enterprise.forms.positionSub', "Lavozim tanlangan bo'lim ichida ro'yxatga qo'shiladi.");
  return tr('enterprise.forms.employeeSub', "Xodim tanlangan bo'lim verify ro'yxatiga qo'shiladi.");
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="enterprise-stat"><div className="enterprise-stat-icon">{icon}</div><div><div className="enterprise-stat-value">{value}</div><div className="enterprise-stat-label">{label}</div></div></div>;
}

function StepButton({ active, index, title, subtitle, onClick }: { active: boolean; index: string; title: string; subtitle: string; onClick: () => void }) {
  return <button className={`enterprise-step ${active ? 'active' : ''}`} type="button" onClick={onClick}><span className="enterprise-step-index">{index}</span><span><strong>{title}</strong><span>{subtitle}</span></span></button>;
}

function ColumnHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return <div className="enterprise-column-head"><div><div className="enterprise-column-title">{icon}{title}</div><div className="enterprise-column-sub">{sub}</div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="enterprise-field"><label>{label}</label>{children}</div>;
}

function Context({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="enterprise-context">{icon}<span>{text}</span></div>;
}

function SubmitRow({ loading, disabled, showCancel, onCancel, label }: { loading: boolean; disabled?: boolean; showCancel?: boolean; onCancel?: () => void; label: string }) {
  return (
    <div className="enterprise-submit-row">
      <button className="enterprise-submit" type="submit" disabled={loading || disabled}>{loading ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}{label}</button>
      {showCancel && <button className="enterprise-cancel" type="button" onClick={onCancel}><X size={16} /></button>}
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="enterprise-empty"><div><div className="enterprise-empty-icon">{icon}</div><div>{text}</div></div></div>;
}

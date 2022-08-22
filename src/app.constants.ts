export class AppConstants {
  static readonly MINUTES = 1;
  static readonly STATE_BUFFER_SIZE = 10;

  static readonly FABLO_API = 'http://localhost:8801';
  static readonly smartContractInvokePoint =
    '/invoke/producer-1/monitorPGUchaincode';
  static readonly smartContractQueryPoint =
    '/query/producer-1/monitorPGUchaincode';

  static readonly PGUMonitorContractMethod = {
    createPGU: 'MonitorPGUContract:CreatePGU',
    getPGU: 'MonitorPGUContract:GetPGU',
    deletePGU: 'MonitorPGUContract:DeletePGU',
    getAllPGUs: 'MonitorPGUContract:GetAllPGUs',
    submitMeasurePGU: 'MonitorPGUContract:SubmitMeasure',
    getMeasurePGU: 'MonitorPGUContract:GetMeasure',
    submitConstraint: 'MonitorPGUContract:SubmitConstraint',
    getConstraint: 'MonitorPGUContract:GetConstraint',
    declareAlert: 'MonitorPGUContract:DeclareAlert',
    declareUrgency: 'MonitorPGUContract:DeclareUrgency',
  };
}

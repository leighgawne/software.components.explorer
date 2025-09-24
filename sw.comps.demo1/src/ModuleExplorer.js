import React, { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronRight, ChevronDown, Upload, Download, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './ModuleExplorer.css';

// --- UI primitives ---
const Button = ({className = "", variant="default", size="md", icon, children, ...props}) => {
  const base = "inline-flex items-center gap-2 rounded-2xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default: "btn-default",
    outline: "btn-outline border",
    ghost: "btn-ghost"
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-2.5 text-lg" };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{icon}{children}</button>
  );
};

const Input = ({className = "", ...props}) => (
  <input className={`input-base w-full rounded-2xl border px-4 py-2 focus:outline-none focus:ring-2 ${className}`} {...props} />
);

const Chip = ({label}) => (
  <span className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600">{label}</span>
);

// --- Seed data: concise but representative. Replace or extend via the Import button. ---
const SEED = [
  {
    "module": "UART",
    "class": "Communication",
    "config": [
      {
        "name": "baud_rate",
        "type": "integer",
        "unit": "baud",
        "min": 300,
        "max": 3000000,
        "default": 115200
      },
      {
        "name": "data_bits",
        "type": "enum",
        "values": [ 5, 6, 7, 8, 9 ],
        "default": 8
      },
      {
        "name": "parity",
        "type": "enum",
        "values": [ "none", "even", "odd", "mark", "space" ],
        "default": "none"
      },
      {
        "name": "stop_bits",
        "type": "enum",
        "values": [ 1, 1.5, 2 ],
        "default": 1
      },
      {
        "name": "flow_control",
        "type": "enum",
        "values": [ "none", "rts_cts", "xon_xoff" ],
        "default": "none"
      },
      {
        "name": "rx_buffer_size",
        "type": "integer",
        "unit": "bytes",
        "min": 16,
        "max": 65536,
        "default": 1024
      },
      {
        "name": "tx_buffer_size",
        "type": "integer",
        "unit": "bytes",
        "min": 16,
        "max": 65536,
        "default": 1024
      },
      {
        "name": "invert_logic",
        "type": "boolean",
        "default": false
      }
    ]
  },
  {
    "module": "SPI",
    "class": "Communication",
    "config": [
      {
        "name": "clock_hz",
        "type": "integer",
        "unit": "Hz",
        "min": 1000,
        "max": 100000000,
        "default": 10000000
      },
      {
        "name": "mode",
        "type": "enum",
        "values": [ "MODE0", "MODE1", "MODE2", "MODE3" ],
        "default": "MODE0"
      },
      {
        "name": "bit_order",
        "type": "enum",
        "values": [ "msb_first", "lsb_first" ],
        "default": "msb_first"
      },
      {
        "name": "frame_bits",
        "type": "integer",
        "unit": "bits",
        "min": 4,
        "max": 32,
        "default": 8
      },
      {
        "name": "cs_active_polarity",
        "type": "enum",
        "values": [ "low", "high" ],
        "default": "low"
      },
      {
        "name": "cs_setup_time",
        "type": "integer",
        "unit": "ns",
        "min": 0,
        "max": 1000,
        "default": 50
      },
      {
        "name": "cs_hold_time",
        "type": "integer",
        "unit": "ns",
        "min": 0,
        "max": 1000,
        "default": 50
      },
      {
        "name": "duplex",
        "type": "enum",
        "values": [ "full", "half" ],
        "default": "full"
      }
    ]
  },
  {
    "module": "I2C",
    "class": "Communication",
    "config": [
      {
        "name": "bus_speed",
        "type": "enum",
        "values": [ "standard@100k", "fast@400k", "fast_plus@1M", "hs@3.4M" ],
        "default": "fast@400k"
      },
      {
        "name": "addressing_mode",
        "type": "enum",
        "values": [ "7bit", "10bit" ],
        "default": "7bit"
      },
      {
        "name": "own_address",
        "type": "integer",
        "unit": "addr",
        "min": 0,
        "max": 1023,
        "default": 80
      },
      {
        "name": "clock_stretching",
        "type": "boolean",
        "default": true
      },
      {
        "name": "timeout",
        "type": "integer",
        "unit": "ms",
        "min": 0,
        "max": 10000,
        "default": 1000
      },
      {
        "name": "scl_fall_filter",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "I3C",
    "class": "Communication",
    "config": [
      {
        "name": "bus_mode",
        "type": "enum",
        "values": [ "SDR", "HDR-DDR", "HDR-TSL", "HDR-TSP" ],
        "default": "SDR"
      },
      {
        "name": "max_data_rate",
        "type": "integer",
        "unit": "Hz",
        "min": 100000,
        "max": 12500000,
        "default": 12000000
      },
      {
        "name": "dynamic_addressing",
        "type": "boolean",
        "default": true
      },
      {
        "name": "ibi_enable",
        "type": "boolean",
        "default": false
      },
      {
        "name": "hot_join",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "CAN",
    "class": "Communication",
    "config": [
      {
        "name": "bitrate_nominal",
        "type": "integer",
        "unit": "bit/s",
        "min": 10000,
        "max": 1000000,
        "default": 500000
      },
      {
        "name": "fd_enable",
        "type": "boolean",
        "default": false
      },
      {
        "name": "bitrate_data",
        "type": "integer",
        "unit": "bit/s",
        "min": 100000,
        "max": 8000000,
        "default": 2000000
      },
      {
        "name": "sample_point",
        "type": "number",
        "unit": "%",
        "min": 50,
        "max": 90,
        "default": 80
      },
      {
        "name": "identifier_mode",
        "type": "enum",
        "values": [ "standard11", "extended29" ],
        "default": "standard11"
      },
      {
        "name": "rx_filters",
        "type": "integer",
        "min": 0,
        "max": 64,
        "default": 8
      },
      {
        "name": "loopback",
        "type": "boolean",
        "default": false
      }
    ]
  },
  {
    "module": "LIN",
    "class": "Communication",
    "config": [
      {
        "name": "baud_rate",
        "type": "integer",
        "unit": "baud",
        "min": 1200,
        "max": 20000,
        "default": 19200
      },
      {
        "name": "role",
        "type": "enum",
        "values": [ "master", "slave" ],
        "default": "slave"
      },
      {
        "name": "checksum",
        "type": "enum",
        "values": [ "classic", "enhanced" ],
        "default": "enhanced"
      },
      {
        "name": "break_length",
        "type": "number",
        "unit": "bit_times",
        "min": 10,
        "max": 20,
        "default": 13
      }
    ]
  },
  {
    "module": "USB",
    "class": "Communication",
    "config": [
      {
        "name": "role",
        "type": "enum",
        "values": [ "host", "device", "otg" ],
        "default": "device"
      },
      {
        "name": "speed",
        "type": "enum",
        "values": [ "full@12M", "high@480M" ],
        "default": "full@12M"
      },
      {
        "name": "max_packet_size",
        "type": "integer",
        "unit": "bytes",
        "min": 8,
        "max": 1024,
        "default": 64
      },
      {
        "name": "power_mode",
        "type": "enum",
        "values": [ "self_powered", "bus_powered" ],
        "default": "bus_powered"
      },
      {
        "name": "endpoint_count",
        "type": "integer",
        "min": 1,
        "max": 16,
        "default": 6
      },
      {
        "name": "vbus_sense",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "Ethernet MAC",
    "class": "Networking",
    "config": [
      {
        "name": "mac_address",
        "type": "string",
        "pattern": "xx:xx:xx:xx:xx:xx",
        "default": "02:00:00:00:00:00"
      },
      {
        "name": "link_speed",
        "type": "enum",
        "values": [ "10M", "100M", "1000M" ],
        "default": "100M"
      },
      {
        "name": "duplex",
        "type": "enum",
        "values": [ "half", "full" ],
        "default": "full"
      },
      {
        "name": "phy_interface",
        "type": "enum",
        "values": [ "MII", "RMII", "RGMII" ],
        "default": "RMII"
      },
      {
        "name": "checksum_offload",
        "type": "boolean",
        "default": true
      },
      {
        "name": "rx_desc",
        "type": "integer",
        "min": 4,
        "max": 256,
        "default": 16
      },
      {
        "name": "tx_desc",
        "type": "integer",
        "min": 4,
        "max": 256,
        "default": 16
      }
    ]
  },
  {
    "module": "WiFi",
    "class": "Networking",
    "config": [
      {
        "name": "ssid",
        "type": "string"
      },
      {
        "name": "security",
        "type": "enum",
        "values": [ "open", "wep", "wpa2_psk", "wpa3_sae", "wpa2_wpa3_mixed" ],
        "default": "wpa2_psk"
      },
      {
        "name": "passphrase",
        "type": "string"
      },
      {
        "name": "band",
        "type": "enum",
        "values": [ "2.4GHz", "5GHz", "6GHz" ],
        "default": "2.4GHz"
      },
      {
        "name": "channel",
        "type": "integer",
        "min": 1,
        "max": 196,
        "default": 6
      },
      {
        "name": "tx_power",
        "type": "number",
        "unit": "dBm",
        "min": 0,
        "max": 20,
        "default": 14
      },
      {
        "name": "ip_mode",
        "type": "enum",
        "values": [ "dhcp", "static" ],
        "default": "dhcp"
      }
    ]
  },
  {
    "module": "Bluetooth LE",
    "class": "Networking",
    "config": [
      {
        "name": "role",
        "type": "enum",
        "values": [ "central", "peripheral" ],
        "default": "peripheral"
      },
      {
        "name": "device_name",
        "type": "string",
        "default": "ble-device"
      },
      {
        "name": "mtu",
        "type": "integer",
        "unit": "bytes",
        "min": 23,
        "max": 517,
        "default": 247
      },
      {
        "name": "conn_interval",
        "type": "number",
        "unit": "ms",
        "min": 7.5,
        "max": 4000,
        "default": 30
      },
      {
        "name": "adv_interval",
        "type": "number",
        "unit": "ms",
        "min": 20,
        "max": 10240,
        "default": 100
      },
      {
        "name": "security_level",
        "type": "enum",
        "values": [ "unencrypted", "le_sc", "le_sc_bonded" ],
        "default": "le_sc"
      }
    ]
  },
  {
    "module": "Cellular Modem",
    "class": "Networking",
    "config": [
      {
        "name": "apn",
        "type": "string"
      },
      {
        "name": "rat",
        "type": "enum",
        "values": [ "LTE-M", "NB-IoT", "LTE", "5G" ],
        "default": "LTE"
      },
      {
        "name": "psm_enable",
        "type": "boolean",
        "default": false
      },
      {
        "name": "edrx_enable",
        "type": "boolean",
        "default": false
      },
      {
        "name": "pin",
        "type": "string"
      },
      {
        "name": "ping_keepalive",
        "type": "integer",
        "unit": "s",
        "min": 0,
        "max": 86400,
        "default": 0
      }
    ]
  },
  {
    "module": "MQTT Client",
    "class": "Networking",
    "config": [
      {
        "name": "broker",
        "type": "string"
      },
      {
        "name": "port",
        "type": "integer",
        "min": 1,
        "max": 65535,
        "default": 8883
      },
      {
        "name": "client_id",
        "type": "string"
      },
      {
        "name": "qos_default",
        "type": "enum",
        "values": [ 0, 1, 2 ],
        "default": 1
      },
      {
        "name": "keep_alive",
        "type": "integer",
        "unit": "s",
        "min": 10,
        "max": 7200,
        "default": 60
      },
      {
        "name": "clean_session",
        "type": "boolean",
        "default": true
      },
      {
        "name": "tls_profile",
        "type": "enum",
        "values": [ "none", "psk", "certs" ],
        "default": "certs"
      }
    ]
  },
  {
    "module": "HTTP Client",
    "class": "Networking",
    "config": [
      {
        "name": "base_url",
        "type": "string"
      },
      {
        "name": "port",
        "type": "integer",
        "min": 1,
        "max": 65535,
        "default": 443
      },
      {
        "name": "tls",
        "type": "boolean",
        "default": true
      },
      {
        "name": "timeout",
        "type": "integer",
        "unit": "ms",
        "min": 100,
        "max": 120000,
        "default": 10000
      },
      {
        "name": "follow_redirects",
        "type": "boolean",
        "default": true
      },
      {
        "name": "max_redirects",
        "type": "integer",
        "min": 0,
        "max": 10,
        "default": 5
      }
    ]
  },
  {
    "module": "TLS/PKI",
    "class": "Security",
    "config": [
      {
        "name": "min_version",
        "type": "enum",
        "values": [ "TLS1.0", "TLS1.1", "TLS1.2", "TLS1.3" ],
        "default": "TLS1.2"
      },
      {
        "name": "cipher_suites",
        "type": "array<string>"
      },
      {
        "name": "ca_bundle_ref",
        "type": "string"
      },
      {
        "name": "client_cert_ref",
        "type": "string"
      },
      {
        "name": "client_key_ref",
        "type": "string"
      },
      {
        "name": "session_resumption",
        "type": "boolean",
        "default": true
      },
      {
        "name": "hostname_verification",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "Crypto Engine",
    "class": "Security",
    "config": [
      {
        "name": "algorithms",
        "type": "array<enum>",
        "values": [ "AES", "CHACHA20", "SHA2", "SHA3", "HMAC", "ECDH", "ECDSA", "RSA" ],
        "default": [ "AES", "SHA2", "HMAC" ]
      },
      {
        "name": "key_store_backend",
        "type": "enum",
        "values": [ "software", "tpm", "hsm", "se050" ],
        "default": "software"
      },
      {
        "name": "rng_source",
        "type": "enum",
        "values": [ "TRNG", "DRBG" ],
        "default": "TRNG"
      },
      {
        "name": "pqc_enable",
        "type": "boolean",
        "default": false
      }
    ]
  },
  {
    "module": "Secure Boot",
    "class": "System/Boot",
    "config": [
      {
        "name": "image_format",
        "type": "enum",
        "values": [ "raw", "mcuboot" ],
        "default": "mcuboot"
      },
      {
        "name": "signature_scheme",
        "type": "enum",
        "values": [ "ECDSA_P256", "RSA2048", "RSA3072", "ED25519" ],
        "default": "ECDSA_P256"
      },
      {
        "name": "rollback_protection",
        "type": "boolean",
        "default": true
      },
      {
        "name": "keyslot",
        "type": "integer",
        "min": 0,
        "max": 7,
        "default": 0
      }
    ]
  },
  {
    "module": "Bootloader (MCU)",
    "class": "System/Boot",
    "config": [
      {
        "name": "transport",
        "type": "enum",
        "values": [ "UART", "USB", "CAN", "Ethernet" ],
        "default": "UART"
      },
      {
        "name": "primary_slot_addr",
        "type": "integer",
        "unit": "bytes",
        "min": 0,
        "max": 4294967295
      },
      {
        "name": "secondary_slot_addr",
        "type": "integer",
        "unit": "bytes",
        "min": 0,
        "max": 4294967295
      },
      {
        "name": "swap_method",
        "type": "enum",
        "values": [ "test", "permanent", "revert" ],
        "default": "test"
      },
      {
        "name": "boot_delay",
        "type": "integer",
        "unit": "ms",
        "min": 0,
        "max": 10000,
        "default": 0
      }
    ]
  },
  {
    "module": "Filesystem",
    "class": "Storage",
    "config": [
      {
        "name": "type",
        "type": "enum",
        "values": [ "littlefs", "fat", "filex" ],
        "default": "littlefs"
      },
      {
        "name": "block_size",
        "type": "integer",
        "unit": "bytes",
        "min": 256,
        "max": 65536,
        "default": 4096
      },
      {
        "name": "cache_size",
        "type": "integer",
        "unit": "bytes",
        "min": 0,
        "max": 65536,
        "default": 2048
      },
      {
        "name": "wear_leveling",
        "type": "boolean",
        "default": true
      },
      {
        "name": "mount_point",
        "type": "string",
        "default": "/fs"
      },
      {
        "name": "auto_mount",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "External Flash",
    "class": "Storage",
    "config": [
      {
        "name": "interface",
        "type": "enum",
        "values": [ "SPI", "QSPI", "OSPI" ],
        "default": "QSPI"
      },
      {
        "name": "read_mode",
        "type": "enum",
        "values": [ "single", "dual", "quad", "octal", "xip" ],
        "default": "quad"
      },
      {
        "name": "dummy_cycles",
        "type": "integer",
        "unit": "cycles",
        "min": 0,
        "max": 24,
        "default": 8
      },
      {
        "name": "erase_block",
        "type": "integer",
        "unit": "KB",
        "min": 4,
        "max": 1024,
        "default": 64
      },
      {
        "name": "quad_enable_method",
        "type": "enum",
        "values": [ "status_reg", "volatile_reg", "cmd_only" ],
        "default": "status_reg"
      }
    ]
  },
  {
    "module": "SD/MMC",
    "class": "Storage",
    "config": [
      {
        "name": "bus_width",
        "type": "enum",
        "values": [ "1-bit", "4-bit", "8-bit" ],
        "default": "4-bit"
      },
      {
        "name": "clock_hz",
        "type": "integer",
        "unit": "Hz",
        "min": 400000,
        "max": 208000000,
        "default": 25000000
      },
      {
        "name": "uhs_mode",
        "type": "enum",
        "values": [ "none", "SDR50", "SDR104", "DDR50" ],
        "default": "none"
      },
      {
        "name": "voltage_switch",
        "type": "boolean",
        "default": false
      },
      {
        "name": "crc_check",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "ADC",
    "class": "Analog",
    "config": [
      {
        "name": "resolution",
        "type": "enum",
        "values": [ "8", "10", "12", "14", "16" ],
        "default": "12"
      },
      {
        "name": "sample_rate",
        "type": "integer",
        "unit": "S/s",
        "min": 1,
        "max": 2000000,
        "default": 10000
      },
      {
        "name": "channels",
        "type": "array<integer>"
      },
      {
        "name": "reference",
        "type": "enum",
        "values": [ "internal", "external" ],
        "default": "internal"
      },
      {
        "name": "oversampling",
        "type": "enum",
        "values": [ "off", "2x", "4x", "8x", "16x", "32x", "64x" ],
        "default": "off"
      },
      {
        "name": "dma",
        "type": "boolean",
        "default": false
      },
      {
        "name": "trigger",
        "type": "enum",
        "values": [ "software", "timer", "external" ],
        "default": "software"
      }
    ]
  },
  {
    "module": "DAC",
    "class": "Analog",
    "config": [
      {
        "name": "resolution",
        "type": "enum",
        "values": [ "8", "10", "12", "16" ],
        "default": "12"
      },
      {
        "name": "reference",
        "type": "enum",
        "values": [ "internal", "external" ],
        "default": "internal"
      },
      {
        "name": "output_buffer",
        "type": "boolean",
        "default": true
      },
      {
        "name": "trigger",
        "type": "enum",
        "values": [ "software", "timer", "external" ],
        "default": "software"
      }
    ]
  },
  {
    "module": "OpAmp",
    "class": "Analog",
    "config": [
      {
        "name": "mode",
        "type": "enum",
        "values": [ "follower", "inverting", "non_inverting", "instrumentation" ],
        "default": "follower"
      },
      {
        "name": "gain",
        "type": "number",
        "min": 1,
        "max": 1024,
        "default": 1
      },
      {
        "name": "bandwidth_mode",
        "type": "enum",
        "values": [ "low_power", "normal", "high_speed" ],
        "default": "normal"
      },
      {
        "name": "offset_trim",
        "type": "integer",
        "unit": "mV",
        "min": -50,
        "max": 50,
        "default": 0
      }
    ]
  },
  {
    "module": "GPIO",
    "class": "Digital I/O",
    "config": [
      {
        "name": "pin",
        "type": "string",
        "pattern": "P[0-9]+\\.[0-9]+"
      },
      {
        "name": "direction",
        "type": "enum",
        "values": [ "in", "out" ],
        "default": "out"
      },
      {
        "name": "pull",
        "type": "enum",
        "values": [ "none", "up", "down" ],
        "default": "none"
      },
      {
        "name": "drive_strength",
        "type": "enum",
        "values": [ "low", "medium", "high" ],
        "default": "medium"
      },
      {
        "name": "interrupt_edge",
        "type": "enum",
        "values": [ "none", "rising", "falling", "both" ],
        "default": "none"
      }
    ]
  },
  {
    "module": "Timer",
    "class": "Timing",
    "config": [
      {
        "name": "mode",
        "type": "enum",
        "values": [ "periodic", "one_shot", "capture", "pulse_width" ],
        "default": "periodic"
      },
      {
        "name": "prescaler",
        "type": "integer",
        "min": 1,
        "max": 65536,
        "default": 1
      },
      {
        "name": "period",
        "type": "integer",
        "unit": "ticks",
        "min": 1,
        "max": 4294967295,
        "default": 10000
      },
      {
        "name": "interrupt",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "PWM",
    "class": "Timing",
    "config": [
      {
        "name": "frequency",
        "type": "integer",
        "unit": "Hz",
        "min": 1,
        "max": 1000000,
        "default": 20000
      },
      {
        "name": "duty_cycle",
        "type": "number",
        "unit": "%",
        "min": 0,
        "max": 100,
        "default": 50
      },
      {
        "name": "alignment",
        "type": "enum",
        "values": [ "edge", "center" ],
        "default": "edge"
      },
      {
        "name": "polarity",
        "type": "enum",
        "values": [ "active_high", "active_low" ],
        "default": "active_high"
      },
      {
        "name": "deadtime",
        "type": "integer",
        "unit": "ns",
        "min": 0,
        "max": 5000,
        "default": 0
      }
    ]
  },
  {
    "module": "RTC",
    "class": "Timing",
    "config": [
      {
        "name": "clock_source",
        "type": "enum",
        "values": [ "LSE_32.768k", "LSI_internal" ],
        "default": "LSE_32.768k"
      },
      {
        "name": "alarm_a",
        "type": "boolean",
        "default": false
      },
      {
        "name": "alarm_b",
        "type": "boolean",
        "default": false
      },
      {
        "name": "dst_auto_adjust",
        "type": "boolean",
        "default": false
      }
    ]
  },
  {
    "module": "DMA/Transfer",
    "class": "Data Movement",
    "config": [
      {
        "name": "channel",
        "type": "integer",
        "min": 0,
        "max": 63,
        "default": 0
      },
      {
        "name": "priority",
        "type": "enum",
        "values": [ "low", "medium", "high", "very_high" ],
        "default": "medium"
      },
      {
        "name": "source_width",
        "type": "enum",
        "values": [ "8bit", "16bit", "32bit" ],
        "default": "32bit"
      },
      {
        "name": "dest_width",
        "type": "enum",
        "values": [ "8bit", "16bit", "32bit" ],
        "default": "32bit"
      },
      {
        "name": "burst_size",
        "type": "enum",
        "values": [ 1, 2, 4, 8, 16 ],
        "default": 4
      },
      {
        "name": "circular_mode",
        "type": "boolean",
        "default": false
      }
    ]
  },
  {
    "module": "Watchdog",
    "class": "System/Reset",
    "config": [
      {
        "name": "timeout",
        "type": "integer",
        "unit": "ms",
        "min": 1,
        "max": 60000,
        "default": 2000
      },
      {
        "name": "window_mode",
        "type": "boolean",
        "default": false
      },
      {
        "name": "early_warning_irq",
        "type": "boolean",
        "default": false
      },
      {
        "name": "reset_enable",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "Motor Control (BLDC/FOC)",
    "class": "Control",
    "config": [
      {
        "name": "control_mode",
        "type": "enum",
        "values": [ "FOC", "six_step", "trapezoidal" ],
        "default": "FOC"
      },
      {
        "name": "pwm_frequency",
        "type": "integer",
        "unit": "Hz",
        "min": 1000,
        "max": 100000,
        "default": 20000
      },
      {
        "name": "current_limit",
        "type": "number",
        "unit": "A",
        "min": 0,
        "max": 100,
        "default": 10
      },
      {
        "name": "dc_bus_voltage",
        "type": "number",
        "unit": "V",
        "min": 0,
        "max": 1000,
        "default": 48
      },
      {
        "name": "sensor_type",
        "type": "enum",
        "values": [ "hall", "encoder", "sensorless" ],
        "default": "hall"
      },
      {
        "name": "pid_current_kp",
        "type": "number",
        "default": 0.1
      },
      {
        "name": "pid_current_ki",
        "type": "number",
        "default": 0.01
      },
      {
        "name": "pid_speed_kp",
        "type": "number",
        "default": 0.1
      },
      {
        "name": "pid_speed_ki",
        "type": "number",
        "default": 0.01
      }
    ]
  },
  {
    "module": "Sensor (Generic)",
    "class": "Sensing",
    "config": [
      {
        "name": "interface",
        "type": "enum",
        "values": [ "I2C", "SPI", "UART" ],
        "default": "I2C"
      },
      {
        "name": "odr",
        "type": "number",
        "unit": "Hz",
        "min": 0.1,
        "max": 10000,
        "default": 100
      },
      {
        "name": "range",
        "type": "number",
        "unit": "unit",
        "min": 0,
        "max": 100000,
        "default": 100
      },
      {
        "name": "resolution_bits",
        "type": "integer",
        "min": 8,
        "max": 24,
        "default": 16
      },
      {
        "name": "avg_filter",
        "type": "enum",
        "values": [ "off", "2x", "4x", "8x", "16x", "32x" ],
        "default": "off"
      }
    ]
  },
  {
    "module": "Audio (I2S)",
    "class": "Human Interface",
    "config": [
      {
        "name": "sample_rate",
        "type": "integer",
        "unit": "Hz",
        "min": 8000,
        "max": 192000,
        "default": 48000
      },
      {
        "name": "word_length",
        "type": "enum",
        "values": [ "16", "24", "32" ],
        "default": "16"
      },
      {
        "name": "channels",
        "type": "enum",
        "values": [ "mono", "stereo" ],
        "default": "stereo"
      },
      {
        "name": "format",
        "type": "enum",
        "values": [ "I2S", "LeftJustified", "RightJustified", "DSP_A", "DSP_B" ],
        "default": "I2S"
      },
      {
        "name": "mclk_ratio",
        "type": "enum",
        "values": [ "256fs", "384fs", "512fs", "768fs" ],
        "default": "256fs"
      }
    ]
  },
  {
    "module": "Graphics/Display",
    "class": "Human Interface",
    "config": [
      {
        "name": "resolution",
        "type": "string",
        "default": "800x480"
      },
      {
        "name": "pixel_format",
        "type": "enum",
        "values": [ "RGB565", "ARGB8888", "RGB888" ],
        "default": "RGB565"
      },
      {
        "name": "refresh_rate",
        "type": "integer",
        "unit": "Hz",
        "min": 30,
        "max": 240,
        "default": 60
      },
      {
        "name": "framebuffer_addr",
        "type": "integer",
        "unit": "bytes",
        "min": 0,
        "max": 4294967295
      },
      {
        "name": "backlight_pwm",
        "type": "integer",
        "unit": "Hz",
        "min": 100,
        "max": 100000,
        "default": 20000
      }
    ]
  },
  {
    "module": "Camera (MIPI/Parallel)",
    "class": "Human Interface",
    "config": [
      {
        "name": "interface",
        "type": "enum",
        "values": [ "MIPI-CSI2", "Parallel" ],
        "default": "MIPI-CSI2"
      },
      {
        "name": "lanes",
        "type": "integer",
        "min": 1,
        "max": 4,
        "default": 2
      },
      {
        "name": "resolution",
        "type": "string",
        "default": "1280x720"
      },
      {
        "name": "frame_rate",
        "type": "integer",
        "unit": "fps",
        "min": 1,
        "max": 240,
        "default": 30
      },
      {
        "name": "pixel_format",
        "type": "enum",
        "values": [ "RAW8", "RAW10", "RAW12", "YUY2", "UYVY", "RGB565" ],
        "default": "RAW10"
      }
    ]
  },
  {
    "module": "ML Inference",
    "class": "Compute/ML",
    "config": [
      {
        "name": "model_format",
        "type": "enum",
        "values": [ "TFLite", "ONNX", "TensorFlow", "CArray" ],
        "default": "TFLite"
      },
      {
        "name": "quantization",
        "type": "enum",
        "values": [ "int8", "float16", "float32" ],
        "default": "int8"
      },
      {
        "name": "input_layout",
        "type": "enum",
        "values": [ "NHWC", "NCHW" ],
        "default": "NHWC"
      },
      {
        "name": "arena_size",
        "type": "integer",
        "unit": "KB",
        "min": 32,
        "max": 262144,
        "default": 1024
      },
      {
        "name": "accelerator",
        "type": "enum",
        "values": [ "cpu", "cmsis-nn", "ethos-u", "gpu" ],
        "default": "cmsis-nn"
      },
      {
        "name": "profiling",
        "type": "boolean",
        "default": false
      }
    ]
  },
  {
    "module": "CRC/Checksum",
    "class": "Utilities",
    "config": [
      {
        "name": "width_bits",
        "type": "enum",
        "values": [ 8, 16, 32, 64 ],
        "default": 32
      },
      {
        "name": "polynomial",
        "type": "string",
        "default": "0x04C11DB7"
      },
      {
        "name": "init_value",
        "type": "string",
        "default": "0xFFFFFFFF"
      },
      {
        "name": "ref_in",
        "type": "boolean",
        "default": true
      },
      {
        "name": "ref_out",
        "type": "boolean",
        "default": true
      },
      {
        "name": "xor_out",
        "type": "string",
        "default": "0xFFFFFFFF"
      }
    ]
  },
  {
    "module": "Power Management",
    "class": "System/Power",
    "config": [
      {
        "name": "sleep_state",
        "type": "enum",
        "values": [ "idle", "standby", "stop", "hibernate" ],
        "default": "standby"
      },
      {
        "name": "voltage_scaling",
        "type": "enum",
        "values": [ "performance", "balanced", "low_power" ],
        "default": "balanced"
      },
      {
        "name": "wake_sources",
        "type": "array<enum>",
        "values": [ "rtc", "gpio", "uart", "i2c", "timer", "extint" ],
        "default": [ "rtc", "gpio" ]
      },
      {
        "name": "clock_gating",
        "type": "boolean",
        "default": true
      },
      {
        "name": "retention_ram",
        "type": "boolean",
        "default": true
      }
    ]
  },
  {
    "module": "Event Link/Interrupt Matrix",
    "class": "System/Connectivity",
    "config": [
      {
        "name": "source",
        "type": "string"
      },
      {
        "name": "destination",
        "type": "string"
      },
      {
        "name": "trigger_type",
        "type": "enum",
        "values": [ "edge", "level" ],
        "default": "edge"
      },
      {
        "name": "edge",
        "type": "enum",
        "values": [ "rising", "falling", "both" ],
        "default": "rising"
      },
      {
        "name": "priority",
        "type": "integer",
        "min": 0,
        "max": 15,
        "default": 8
      }
    ]
  },
  {
    "module": "Logging/Trace",
    "class": "Diagnostics",
    "config": [
      {
        "name": "backend",
        "type": "enum",
        "values": [ "ITM", "SWO", "RTT", "UART", "SEGGER" ],
        "default": "RTT"
      },
      {
        "name": "level",
        "type": "enum",
        "values": [ "error", "warn", "info", "debug", "trace" ],
        "default": "info"
      },
      {
        "name": "buffer_size",
        "type": "integer",
        "unit": "bytes",
        "min": 128,
        "max": 1048576,
        "default": 4096
      },
      {
        "name": "timestamp_source",
        "type": "enum",
        "values": [ "rtc", "systick", "timer" ],
        "default": "systick"
      },
      {
        "name": "drop_policy",
        "type": "enum",
        "values": [ "drop_oldest", "drop_newest", "block" ],
        "default": "drop_oldest"
      }
    ]
  },
  {
    "module": "NTP/PTP Time Sync",
    "class": "Networking",
    "config": [
      {
        "name": "protocol",
        "type": "enum",
        "values": [ "NTP", "PTP" ],
        "default": "NTP"
      },
      {
        "name": "server",
        "type": "string",
        "default": "pool.ntp.org"
      },
      {
        "name": "sync_interval",
        "type": "integer",
        "unit": "s",
        "min": 1,
        "max": 86400,
        "default": 3600
      },
      {
        "name": "gptp_profile",
        "type": "enum",
        "values": [ "default", "automotive", "AVB" ],
        "default": "default"
      },
      {
        "name": "utc_offset",
        "type": "integer",
        "unit": "s",
        "min": -46800,
        "max": 50400,
        "default": 0
      }
    ]
  }
];


// --- Helpers ---
const groupByClass = (mods) => mods.reduce((acc, m) => {
  (acc[m.class] ||= []).push(m); return acc;
}, {});

function useLocalState(key, initial) {
  const [val, setVal] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// --- Components ---
const Sidebar = ({classes, counts, selected, onSelect}) => {
  return (
    <div className="sidebar-container h-full w-64 shrink-0 border-r border-gray-200 p-3 overflow-y-auto">
      <div className="mb-3 flex items-center gap-2 text-gray-700">
        <SlidersHorizontal className="h-4 w-4"/>
        <span className="font-semibold">Classes</span>
      </div>
      <button className={`w-full text-left mb-1 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors ${selected===null?"ring-2 ring-black bg-gray-100":""}`} onClick={()=>onSelect(null)}>
        All <span className="float-right text-xs text-gray-500">{Object.values(counts).reduce((a,b)=>a+b,0)}</span>
      </button>
      {classes.map(cls => (
        <button key={cls} className={`w-full text-left mb-1 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors ${selected===cls?"ring-2 ring-black bg-gray-100":""}`} onClick={()=>onSelect(cls)}>
          {cls} <span className="float-right text-xs text-gray-500">{counts[cls]||0}</span>
        </button>
      ))}
    </div>
  );
};

const ConfigTable = ({config}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="border-b p-2">Name</th>
            <th className="border-b p-2">Type</th>
            <th className="border-b p-2">Unit</th>
            <th className="border-b p-2">Range</th>
            <th className="border-b p-2">Values</th>
            <th className="border-b p-2">Default</th>
          </tr>
        </thead>
        <tbody>
          {config.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border-b p-2 font-medium">{p.name}</td>
              <td className="border-b p-2">{p.type}</td>
              <td className="border-b p-2">{p.unit || ""}</td>
              <td className="border-b p-2">{(p.min!==undefined||p.max!==undefined)?`${p.min ?? ""} – ${p.max ?? ""}`:""}</td>
              <td className="border-b p-2">{p.values? Array.isArray(p.values)? p.values.join(", ") : String(p.values): ""}</td>
              <td className="border-b p-2">{p.default!==undefined? JSON.stringify(p.default):""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ModuleCard = ({m, onSelect, selected}) => (
  <motion.div layout onClick={onSelect} className={`cursor-pointer rounded-2xl border border-gray-200 p-4 shadow-sm transition hover:shadow ${selected?"ring-2 ring-black": ""}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{m.class}</div>
        <div className="text-lg font-semibold">{m.module}</div>
      </div>
      {selected ? <ChevronDown/> : <ChevronRight/>}
    </div>
    <div className="mt-3 flex flex-wrap gap-1">
      {m.config.slice(0,6).map((p, idx) => <Chip key={idx} label={p.name} />)}
      {m.config.length>6 && <Chip label={`+${m.config.length-6} more`} />}
    </div>
  </motion.div>
);

const Toolbar = ({onImport, data}) => {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modules.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) onImport(parsed);
        else alert("Invalid format: expected an array of modules");
      } catch (e) { alert("Failed to parse JSON: "+ e.message); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
        <Upload className="h-4 w-4"/>
        Import JSON
        <input type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if (f) importJson(f);}} />
      </label>
      <Button variant="outline" icon={<Download className="h-4 w-4"/>} onClick={exportJson}>Export</Button>
    </div>
  );
};

// --- Main App ---
export default function ModuleExplorer() {
  const [data, setData] = useLocalState("mods:data", SEED);
  const [q, setQ] = useLocalState("mods:q", "");
  const [cls, setCls] = useLocalState("mods:class", null);
  const [active, setActive] = useState(data[0] ?? null);

  useEffect(()=>{
    if (active) {
      const exists = data.find(m => m.module===active.module && m.class===active.class);
      if (!exists) setActive(data[0] ?? null);
    }
  }, [data]);

  const grouped = useMemo(()=> groupByClass(data), [data]);
  const classes = useMemo(()=> Object.keys(grouped).sort(), [grouped]);
  const counts = useMemo(()=> Object.fromEntries(classes.map(c => [c, grouped[c].length])), [classes, grouped]);

  const filtered = useMemo(()=>{
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let mods = cls? (grouped[cls] ?? []) : data;
    if (words.length===0) return mods;
    return mods.filter(m => {
      const hay = `${m.module} ${m.class} ${m.config.map(p=>p.name+" "+p.type+" "+(p.values||[])).join(" ")}`.toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }, [q, data, cls, grouped]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                <Input placeholder="Search modules, params, types…" value={q} onChange={e=>setQ(e.target.value)} className="pl-9"/>
              </div>
              <Toolbar onImport={setData} data={data} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4">
        <div className="flex gap-6 py-6">
          <Sidebar classes={classes} counts={counts} selected={cls} onSelect={setCls} />

          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600">Showing <b>{filtered.length}</b> of <b>{data.length}</b> modules{cls? <> in <b>{cls}</b></>: null}.</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(m => (
                <ModuleCard key={m.class+"/"+m.module} m={m} onSelect={()=>setActive(m)} selected={active?.module===m.module && active?.class===m.class} />
              ))}
            </div>

            <AnimatePresence>
              {active && (
                <motion.div key={active.module} layout initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow">
                  <div className="mb-1 text-sm text-gray-500">{active.class}</div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{active.module}</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4"/>} onClick={()=>setActive({...active})}>Refresh</Button>
                    </div>
                  </div>
                  <ConfigTable config={active.config} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-gray-500">
          Built for exploratory configuration design — import your JSON to view full catalogs.
        </div>
      </footer>
    </div>
  );
}

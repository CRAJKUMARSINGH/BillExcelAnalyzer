"""
Configuration Loader for BillGenerator Unified
"""
import json
import os
from pathlib import Path
from typing import Dict, Any


class Config:
    """Configuration class"""
    
    def __init__(self, config_dict: Dict[str, Any]):
        self.app_name = config_dict.get('app_name', 'BillGenerator Unified')
        self.version = config_dict.get('version', '2.0.0')
        self.mode = config_dict.get('mode', 'Standard')
        
        # Features
        features_dict = config_dict.get('features', {})
        self.features = Features(features_dict)
        
        # UI
        ui_dict = config_dict.get('ui', {})
        self.ui = UI(ui_dict)
        
        # Processing
        processing_dict = config_dict.get('processing', {})
        self.processing = Processing(processing_dict)


class Features:
    """Features configuration"""
    
    def __init__(self, features_dict: Dict[str, Any]):
        self.excel_upload = features_dict.get('excel_upload', True)
        self.online_entry = features_dict.get('online_entry', True)
        self.batch_processing = features_dict.get('batch_processing', True)
        self.advanced_pdf = features_dict.get('advanced_pdf', True)
        self.analytics = features_dict.get('analytics', False)
        self.custom_templates = features_dict.get('custom_templates', False)
        self.api_access = features_dict.get('api_access', False)
    
    def is_enabled(self, feature_name: str) -> bool:
        """Check if a feature is enabled"""
        return getattr(self, feature_name, False)


class UI:
    """UI configuration"""
    
    def __init__(self, ui_dict: Dict[str, Any]):
        self.theme = ui_dict.get('theme', 'default')
        self.show_debug = ui_dict.get('show_debug', False)
        
        branding_dict = ui_dict.get('branding', {})
        self.branding = Branding(branding_dict)


class Branding:
    """Branding configuration"""
    
    def __init__(self, branding_dict: Dict[str, Any]):
        self.title = branding_dict.get('title', 'BillGenerator Unified')
        self.icon = branding_dict.get('icon', '📄')
        self.color = branding_dict.get('color', '#00b894')


class Processing:
    """Processing configuration"""
    
    def __init__(self, processing_dict: Dict[str, Any]):
        self.max_file_size_mb = processing_dict.get('max_file_size_mb', 50)
        self.enable_caching = processing_dict.get('enable_caching', True)
        self.pdf_engine = processing_dict.get('pdf_engine', 'reportlab')


class ConfigLoader:
    """Load configuration from JSON files"""
    
    @staticmethod
    def load_from_file(config_path: str) -> Config:
        """Load configuration from a JSON file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_dict = json.load(f)
            return Config(config_dict)
        except FileNotFoundError:
            print(f"⚠️ Config file not found: {config_path}, using defaults")
            return ConfigLoader.get_default_config()
        except json.JSONDecodeError as e:
            print(f"⚠️ Error parsing config file: {e}, using defaults")
            return ConfigLoader.get_default_config()
    
    @staticmethod
    def load_from_env(env_var: str, default_path: str) -> Config:
        """Load configuration from environment variable or default path"""
        config_path = os.environ.get(env_var, default_path)
        return ConfigLoader.load_from_file(config_path)
    
    @staticmethod
    def get_default_config() -> Config:
        """Get default configuration"""
        default_config = {
            'app_name': 'BillGenerator Unified',
            'version': '2.0.0',
            'mode': 'Standard',
            'features': {
                'excel_upload': True,
                'online_entry': True,
                'batch_processing': True,
                'advanced_pdf': True,
                'analytics': False
            },
            'ui': {
                'theme': 'default',
                'show_debug': False,
                'branding': {
                    'title': 'BillGenerator Unified',
                    'icon': '📄',
                    'color': '#00b894'
                }
            },
            'processing': {
                'max_file_size_mb': 50,
                'enable_caching': True,
                'pdf_engine': 'reportlab'
            }
        }
        return Config(default_config)
